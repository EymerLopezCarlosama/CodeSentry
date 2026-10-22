// PROMPT — resultados.repository.ts — Acceso a datos (SQL) de resultados (HU-07)
//
// Resultado JOIN Archivo JOIN ChecklistItem JOIN Estado filtrando por id_analisis y severidad opcional; ORDER BY FIELD(severidad,"critica","alta","media","baja").
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem

import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import type { EstadoChecklist, Severidad, TipoHallazgo } from "../types";

export interface FilaHallazgo extends RowDataPacket {
  ruta_relativa: string;
  id_resultado: number;
  tipo: TipoHallazgo;
  severidad: Severidad;
  linea_codigo: number;
  descripcion: string;
  estado_checklist: EstadoChecklist;
}

// Hallazgos de un análisis, ordenados por archivo y por severidad (crítica → baja).
export async function listarPorAnalisis(
  idAnalisis: number,
  severidad?: Severidad
): Promise<FilaHallazgo[]> {
  const parametros: Array<number | string> = [idAnalisis];
  let filtroSeveridad = "";
  if (severidad) {
    filtroSeveridad = "AND r.severidad = ?";
    parametros.push(severidad);
  }

  const [filas] = await pool.query<FilaHallazgo[]>(
    `SELECT a.ruta_relativa, r.id_resultado, r.tipo, r.severidad, r.linea_codigo,
            r.descripcion, COALESCE(e.nombre_estado, 'pendiente') AS estado_checklist
     FROM Resultado r
     JOIN Archivo a ON a.id_archivo = r.id_archivo
     LEFT JOIN ChecklistItem c ON c.id_resultado = r.id_resultado
     LEFT JOIN Estado e ON e.id_estado = c.id_estado
     WHERE r.id_analisis = ? ${filtroSeveridad}
     ORDER BY a.ruta_relativa,
              FIELD(r.severidad, 'critica', 'alta', 'media', 'baja'),
              r.linea_codigo`,
    parametros
  );
  return filas;
}