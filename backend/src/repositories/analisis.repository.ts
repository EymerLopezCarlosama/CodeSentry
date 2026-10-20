import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import {
  CodigoLenguaje,
  EstadoAnalisis,
  NombreLenguaje,
  Severidad,
  TipoHallazgo,
  TipoObjetivo,
} from "../types";

export interface AnalisisDetalle {
  id_analisis: number;
  modelo_ia_usado: string;
  fecha_analisis: string;
  estado: EstadoAnalisis;
}

/** Datos para armar la llamada al analyzer (ruta_base = Proyecto.ruta_carpeta). */
export interface ContextoAnalisis {
  id_analisis: number;
  ruta_base: string;
  tipo_objetivo: TipoObjetivo;
  ruta_relativa: string | null; // solo si tipo_objetivo = "archivo"
  modelo: string;
  lenguajes: CodigoLenguaje[];
}

export interface HallazgoNuevo {
  ruta_relativa: string;
  tipo: TipoHallazgo;
  severidad: Severidad;
  linea_codigo: number;
  descripcion: string;
}

export interface ResumenInsercion {
  insertados: number;
  omitidos: string[]; // rutas que no existen en Archivo
}

const CODIGO_POR_NOMBRE: Record<NombreLenguaje, CodigoLenguaje> = {
  JavaScript: "js",
  TypeScript: "ts",
  Python: "py",
};

interface FilaAnalisis extends RowDataPacket {
  id_analisis: number;
  modelo_ia_usado: string;
  fecha_analisis: string;
  estado: EstadoAnalisis;
}

export async function obtenerPorId(idAnalisis: number): Promise<AnalisisDetalle | null> {
  const [filas] = await pool.query<FilaAnalisis[]>(
    `SELECT a.id_analisis, a.modelo_ia_usado, a.fecha_analisis, e.nombre_estado AS estado
     FROM Analisis a
     JOIN Estado e ON e.id_estado = a.id_estado
     WHERE a.id_analisis = ?`,
    [idAnalisis]
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

/** Devuelve true si el análisis existía. */
export async function cambiarEstado(idAnalisis: number, estado: EstadoAnalisis): Promise<boolean> {
  const idEstado = await obtenerIdEstado(estado, "analisis");
  if (idEstado === null) {
    throw new Error(`analisis.repository.cambiarEstado: el estado "${estado}" no existe en Estado`);
  }
  const [r] = await pool.query<ResultSetHeader>(
    `UPDATE Analisis SET id_estado = ? WHERE id_analisis = ?`,
    [idEstado, idAnalisis]
  );
  return r.affectedRows > 0;
}

interface FilaContexto extends RowDataPacket {
  id_analisis: number;
  modelo_ia_usado: string;
  id_proyecto: number;
  ruta_carpeta: string;
  tipo_objetivo: TipoObjetivo;
  ruta_relativa: string | null;
}

interface FilaNombreLenguaje extends RowDataPacket {
  nombre: NombreLenguaje;
}

export async function obtenerContexto(idAnalisis: number): Promise<ContextoAnalisis | null> {
  const [filas] = await pool.query<FilaContexto[]>(
    `SELECT a.id_analisis, a.modelo_ia_usado, p.id_proyecto, p.ruta_carpeta,
            s.tipo_objetivo, ar.ruta_relativa
     FROM Analisis a
     JOIN SolicitudRevision s ON s.id_solicitud = a.id_solicitud
     JOIN Proyecto p ON p.id_proyecto = s.id_proyecto
     LEFT JOIN Archivo ar ON ar.id_archivo = s.id_archivo
     WHERE a.id_analisis = ?`,
    [idAnalisis]
  );
  const fila = filas[0];
  if (!fila) return null;

  const [langs] = await pool.query<FilaNombreLenguaje[]>(
    `SELECT l.nombre
     FROM Proyecto_Lenguaje pl
     JOIN Lenguaje l ON l.id_lenguaje = pl.id_lenguaje
     WHERE pl.id_proyecto = ?`,
    [fila.id_proyecto]
  );

  return {
    id_analisis: fila.id_analisis,
    ruta_base: fila.ruta_carpeta,
    tipo_objetivo: fila.tipo_objetivo,
    ruta_relativa: fila.ruta_relativa,
    modelo: fila.modelo_ia_usado,
    lenguajes: langs.map((l) => CODIGO_POR_NOMBRE[l.nombre]),
  };
}

interface FilaIdProyecto extends RowDataPacket {
  id_proyecto: number;
}

interface FilaArchivoRuta extends RowDataPacket {
  id_archivo: number;
  ruta_relativa: string;
}

// Transacción: Resultado + ChecklistItem "pendiente" por cada hallazgo.
export async function insertarResultadosConChecklist(
  idAnalisis: number,
  hallazgos: HallazgoNuevo[]
): Promise<ResumenInsercion> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();

    const [proy] = await conexion.query<FilaIdProyecto[]>(
      `SELECT s.id_proyecto
       FROM Analisis a
       JOIN SolicitudRevision s ON s.id_solicitud = a.id_solicitud
       WHERE a.id_analisis = ?`,
      [idAnalisis]
    );
    if (!proy[0]) throw new Error(`analisis.repository: el análisis ${idAnalisis} no existe`);

    const [archivos] = await conexion.query<FilaArchivoRuta[]>(
      `SELECT id_archivo, ruta_relativa FROM Archivo WHERE id_proyecto = ?`,
      [proy[0].id_proyecto]
    );
    const idPorRuta = new Map(archivos.map((a) => [a.ruta_relativa, a.id_archivo]));

    const [est] = await conexion.query<FilaIdEstado[]>(
      `SELECT id_estado FROM Estado WHERE nombre_estado = 'pendiente' AND contexto_modulo = 'checklist'`
    );
    if (!est[0]) throw new Error(`analisis.repository: falta el estado "pendiente" de checklist`);

    let insertados = 0;
    const omitidos = new Set<string>();

    for (const h of hallazgos) {
      const idArchivo = idPorRuta.get(h.ruta_relativa);
      if (idArchivo === undefined) {
        omitidos.add(h.ruta_relativa);
        continue;
      }
      const [res] = await conexion.query<ResultSetHeader>(
        `INSERT INTO Resultado (id_analisis, id_archivo, tipo, descripcion, severidad, linea_codigo)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [idAnalisis, idArchivo, h.tipo, h.descripcion, h.severidad, h.linea_codigo]
      );
      await conexion.query(
        `INSERT INTO ChecklistItem (id_resultado, id_estado) VALUES (?, ?)`,
        [res.insertId, est[0].id_estado]
      );
      insertados++;
    }

    await conexion.commit();
    return { insertados, omitidos: [...omitidos] };
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }
}