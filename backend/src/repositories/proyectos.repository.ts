import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { NombreLenguaje, Proyecto, ProyectoDetalle } from "../types";
import { ResultSetHeader } from "mysql2";
import { pool } from "../config/database";

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

// HU01 (Jhon)
export async function obtenerPorRuta(ruta: string): Promise<Proyecto | null> {
  return pendiente("obtenerPorRuta");
}

export async function obtenerIdEstado(nombre: string, contexto: string): Promise<number | null> {
  return pendiente("obtenerIdEstado");
}

// Transacción: Proyecto + Proyecto_Lenguaje. Devuelve el id nuevo.
export async function insertar(datos: DatosNuevoProyecto): Promise<number> {
  return pendiente("insertar");
}

// HU03 (Pao): pone fecha_actualizacion = hoy. Devuelve filas afectadas.
export async function actualizar(id: number, datos: DatosActualizarProyecto): Promise<number> {
  return pendiente("actualizar");
}

// HU04 (Pao): devuelve cuántas filas borró (0 = no existía).
export async function eliminar(id: number): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "DELETE FROM Proyecto WHERE id_proyecto = ?",
    [id]
  );
  return resultado.affectedRows;
}