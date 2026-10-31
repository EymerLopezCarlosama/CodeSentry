// PROMPT — revisiones.repository.ts — Acceso a datos (SQL) de revisiones (HU-05)
//
// insertarSolicitud, insertarAnalisis (usar la misma conexión/transacción), obtenerSolicitud.
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis

import { ResultSetHeader, RowDataPacket } from "mysql2";
import type { PoolConnection } from "mysql2/promise";
import { pool } from "../config/database";
import type { SolicitudRevision, TipoObjetivo } from "../types";

export interface DatosNuevaSolicitud {
  id_proyecto: number;
  tipo_objetivo: TipoObjetivo;
  id_archivo: number | null;
}

export interface DatosNuevoAnalisis {
  id_solicitud: number;
  modelo_ia_usado: string;
  id_estado: number;
}

interface FilaSolicitud extends RowDataPacket, SolicitudRevision {}

// Las dos inserciones reciben la conexión de la transacción del servicio.
export async function insertarSolicitud(
  conexion: PoolConnection,
  datos: DatosNuevaSolicitud
): Promise<number> {
  const [resultado] = await conexion.query<ResultSetHeader>(
    `INSERT INTO SolicitudRevision (id_proyecto, tipo_objetivo, id_archivo)
     VALUES (?, ?, ?)`,
    [datos.id_proyecto, datos.tipo_objetivo, datos.id_archivo]
  );
  return resultado.insertId;
}

export async function insertarAnalisis(
  conexion: PoolConnection,
  datos: DatosNuevoAnalisis
): Promise<number> {
  const [resultado] = await conexion.query<ResultSetHeader>(
    `INSERT INTO Analisis (id_solicitud, modelo_ia_usado, id_estado)
     VALUES (?, ?, ?)`,
    [datos.id_solicitud, datos.modelo_ia_usado, datos.id_estado]
  );
  return resultado.insertId;
}

export async function obtenerSolicitud(idSolicitud: number): Promise<SolicitudRevision | null> {
  const [filas] = await pool.query<FilaSolicitud[]>(
    `SELECT id_solicitud, id_proyecto, tipo_objetivo, id_archivo, fecha_solicitud
     FROM SolicitudRevision
     WHERE id_solicitud = ?`,
    [idSolicitud]
  );
  return filas[0] ?? null;
}