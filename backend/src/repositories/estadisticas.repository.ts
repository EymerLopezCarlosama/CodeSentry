import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";

export interface FilaEstadisticaRegla {
  regla: string;
  total: number;
  aceptadas: number;
  rechazadas: number;
  pendientes: number;
  falsos_positivos: number;
}

// Solo hallazgos con regla conocida (los anteriores a la migración 001 no cuentan)
export async function contarPorRegla(): Promise<FilaEstadisticaRegla[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT r.regla,
            COUNT(*) AS total,
            SUM(e.nombre_estado = 'aceptada')  AS aceptadas,
            SUM(e.nombre_estado = 'rechazada') AS rechazadas,
            SUM(e.nombre_estado = 'pendiente') AS pendientes,
            SUM(e.nombre_estado = 'rechazada' AND c.motivo = 'falso_positivo') AS falsos_positivos
       FROM Resultado r
       JOIN ChecklistItem c ON c.id_resultado = r.id_resultado
       JOIN Estado e ON e.id_estado = c.id_estado
      WHERE r.regla IS NOT NULL
      GROUP BY r.regla
      ORDER BY total DESC, r.regla`
  );
  return filas.map((f) => ({
    regla: String(f.regla),
    total: Number(f.total),
    aceptadas: Number(f.aceptadas),
    rechazadas: Number(f.rechazadas),
    pendientes: Number(f.pendientes),
    falsos_positivos: Number(f.falsos_positivos),
  }));
}