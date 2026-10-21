import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { FormatoReporte, Reporte, Severidad } from "../types";

export interface AnalisisBasico {
  id_analisis: number;
  fecha_analisis: string;
  modelo_ia_usado: string;
  estado: string;
}

export interface DatosReporte {
  total: number;
  por_severidad: Record<Severidad, number>;
  por_archivo: { ruta_relativa: string; hallazgos: number }[];
}

interface FilaAnalisis extends RowDataPacket, AnalisisBasico {}
interface FilaSeveridad extends RowDataPacket {
  severidad: Severidad;
  total: number;
}
interface FilaArchivo extends RowDataPacket {
  ruta_relativa: string;
  hallazgos: number;
}
interface FilaReporte extends RowDataPacket, Reporte {}

export async function obtenerAnalisis(idAnalisis: number): Promise<AnalisisBasico | null> {
  const [filas] = await pool.query<FilaAnalisis[]>(
    `SELECT a.id_analisis, a.fecha_analisis, a.modelo_ia_usado, e.nombre_estado AS estado
     FROM Analisis a
     JOIN Estado e ON e.id_estado = a.id_estado
     WHERE a.id_analisis = ?`,
    [idAnalisis]
  );
  return filas[0] ?? null;
}

// Conteos agregados por severidad y por archivo
export async function datosParaReporte(idAnalisis: number): Promise<DatosReporte> {
  const [sev] = await pool.query<FilaSeveridad[]>(
    `SELECT severidad, COUNT(*) AS total
     FROM Resultado WHERE id_analisis = ? GROUP BY severidad`,
    [idAnalisis]
  );
  const [arch] = await pool.query<FilaArchivo[]>(
    `SELECT a.ruta_relativa, COUNT(*) AS hallazgos
     FROM Resultado r
     JOIN Archivo a ON a.id_archivo = r.id_archivo
     WHERE r.id_analisis = ?
     GROUP BY a.id_archivo, a.ruta_relativa
     ORDER BY hallazgos DESC, a.ruta_relativa`,
    [idAnalisis]
  );

  const por_severidad: Record<Severidad, number> = { baja: 0, media: 0, alta: 0, critica: 0 };
  for (const f of sev) por_severidad[f.severidad] = Number(f.total);

  const por_archivo = arch.map((f) => ({
    ruta_relativa: f.ruta_relativa,
    hallazgos: Number(f.hallazgos),
  }));
  const total = Object.values(por_severidad).reduce((a, b) => a + b, 0);

  return { total, por_severidad, por_archivo };
}

export async function insertar(
  idAnalisis: number,
  formato: FormatoReporte,
  rutaArchivo: string
): Promise<number> {
  const [r] = await pool.query<ResultSetHeader>(
    "INSERT INTO Reporte (id_analisis, formato, ruta_archivo) VALUES (?, ?, ?)",
    [idAnalisis, formato, rutaArchivo]
  );
  return r.insertId;
}

export async function listarPorAnalisis(idAnalisis: number): Promise<Reporte[]> {
  const [filas] = await pool.query<FilaReporte[]>(
    "SELECT * FROM Reporte WHERE id_analisis = ? ORDER BY id_reporte DESC",
    [idAnalisis]
  );
  return filas;
}

export async function obtenerPorId(idReporte: number): Promise<Reporte | null> {
  const [filas] = await pool.query<FilaReporte[]>(
    "SELECT * FROM Reporte WHERE id_reporte = ?",
    [idReporte]
  );
  return filas[0] ?? null;
}