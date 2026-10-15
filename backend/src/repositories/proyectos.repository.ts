import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { NombreLenguaje, Proyecto, ProyectoDetalle } from "../types";

export interface DatosNuevoProyecto {
  nombre: string;
  ruta_carpeta: string;
  modelo_ia: string;
  id_estado: number;
  lenguajes: NombreLenguaje[];
}

export interface DatosActualizarProyecto {
  nombre?: string;
  ruta_carpeta?: string;
  modelo_ia?: string;
  lenguajes?: NombreLenguaje[];
}

function pendiente(funcion: string): never {
  throw new Error(`proyectos.repository.${funcion}: pendiente de implementar`);
}

// HU01 (Jhon)
interface FilaProyectoSimple extends RowDataPacket, Proyecto {}

export async function obtenerPorRuta(ruta: string): Promise<Proyecto | null> {
  const [filas] = await pool.query<FilaProyectoSimple[]>(
    `SELECT id_proyecto, nombre, ruta_carpeta, modelo_ia,
            fecha_registro, fecha_actualizacion, id_estado
     FROM Proyecto
     WHERE ruta_carpeta = ?`,
    [ruta]
  );
  return filas[0] ?? null;
}

interface FilaIdEstado extends RowDataPacket {
  id_estado: number;
}

export async function obtenerIdEstado(nombre: string, contexto: string): Promise<number | null> {
  const [filas] = await pool.query<FilaIdEstado[]>(
    `SELECT id_estado FROM Estado WHERE nombre_estado = ? AND contexto_modulo = ?`,
    [nombre, contexto]
  );
  return filas[0]?.id_estado ?? null;
}

// Transacción: Proyecto + Proyecto_Lenguaje. Devuelve el id nuevo.
export async function insertar(datos: DatosNuevoProyecto): Promise<number> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const [resultado] = await conexion.query<ResultSetHeader>(
      `INSERT INTO Proyecto (nombre, ruta_carpeta, modelo_ia, id_estado)
       VALUES (?, ?, ?, ?)`,
      [datos.nombre, datos.ruta_carpeta, datos.modelo_ia, datos.id_estado]
    );
    const idProyecto = resultado.insertId;

    await conexion.query(
      `INSERT INTO Proyecto_Lenguaje (id_proyecto, id_lenguaje)
       SELECT ?, id_lenguaje FROM Lenguaje WHERE nombre IN (?)`,
      [idProyecto, datos.lenguajes]
    );

    await conexion.commit();
    return idProyecto;
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }
}

interface FilaProyecto extends RowDataPacket {
  id_proyecto: number;
  nombre: string;
  ruta_carpeta: string;
  modelo_ia: string;
  fecha_registro: string;
  fecha_actualizacion: string | null;
  id_estado: number;
  estado: string;
}

interface FilaLenguaje extends RowDataPacket {
  id_proyecto: number;
  nombre: NombreLenguaje;
}

const SELECT_PROYECTO = `
  SELECT p.id_proyecto, p.nombre, p.ruta_carpeta, p.modelo_ia,
         p.fecha_registro, p.fecha_actualizacion, p.id_estado,
         e.nombre_estado AS estado
  FROM Proyecto p
  JOIN Estado e ON e.id_estado = p.id_estado`;

// Devuelve { id_proyecto → ["JavaScript", "Python", ...] } para los ids pedidos
async function lenguajesPorProyecto(ids: number[]): Promise<Map<number, NombreLenguaje[]>> {
  const mapa = new Map<number, NombreLenguaje[]>();
  if (ids.length === 0) return mapa;

  const [filas] = await pool.query<FilaLenguaje[]>(
  `SELECT pl.id_proyecto, l.nombre
   FROM Proyecto_Lenguaje pl
   JOIN Lenguaje l ON l.id_lenguaje = pl.id_lenguaje
   WHERE pl.id_proyecto IN (?)
   ORDER BY l.id_lenguaje`,
  [ids]
);

  for (const fila of filas) {
    const lista = mapa.get(fila.id_proyecto) ?? [];
    lista.push(fila.nombre);
    mapa.set(fila.id_proyecto, lista);
  }
  return mapa;
}

function aDetalle(fila: FilaProyecto, lenguajes: NombreLenguaje[]): ProyectoDetalle {
  return {
    id_proyecto: fila.id_proyecto,
    nombre: fila.nombre,
    ruta_carpeta: fila.ruta_carpeta,
    modelo_ia: fila.modelo_ia,
    fecha_registro: fila.fecha_registro,
    fecha_actualizacion: fila.fecha_actualizacion,
    id_estado: fila.id_estado,
    estado: fila.estado,
    lenguajes,
  };
}

// HU02 (Jhon): JOIN con Estado y lenguajes por Proyecto_Lenguaje
export async function listar(): Promise<ProyectoDetalle[]> {
  const [filas] = await pool.query<FilaProyecto[]>(
    `${SELECT_PROYECTO} ORDER BY p.id_proyecto DESC`
  );
  const lenguajes = await lenguajesPorProyecto(filas.map((f) => f.id_proyecto));
  return filas.map((f) => aDetalle(f, lenguajes.get(f.id_proyecto) ?? []));
}

export async function obtenerPorId(id: number): Promise<ProyectoDetalle | null> {
  const [filas] = await pool.query<FilaProyecto[]>(
    `${SELECT_PROYECTO} WHERE p.id_proyecto = ?`,
    [id]
  );
  if (filas.length === 0) return null;
  const lenguajes = await lenguajesPorProyecto([id]);
  return aDetalle(filas[0], lenguajes.get(id) ?? []);
}

// HU03 (Pao): pone fecha_actualizacion = hoy. Devuelve filas afectadas.
export async function actualizar(id: number, datos: DatosActualizarProyecto): Promise<number> {
  return pendiente("actualizar");
}

// HU04 (Pao): devuelve cuántas filas borró (0 = no existía).
export async function eliminar(id: number): Promise<number> {
  return pendiente("eliminar");
}