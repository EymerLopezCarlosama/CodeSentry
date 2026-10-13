// PROMPT — dashboard.repository.ts — Acceso a datos (SQL) de dashboard (HU-10)
//
// COUNTs de proyectos/análisis/hallazgos, GROUP BY severidad, GROUP BY estado de checklist y el detalle por proyecto (cadena Proyecto → SolicitudRevision → Analisis → Resultado → ChecklistItem).
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Dashboard") · tablas: Proyecto, Analisis, Resultado, ChecklistItem

import { RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { DashboardRespuesta } from "../types";

export async function contarTotales(): Promise<DashboardRespuesta["totales"]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT
        (SELECT COUNT(*) FROM Proyecto)  AS proyectos,
        (SELECT COUNT(*) FROM Analisis)  AS analisis,
        (SELECT COUNT(*) FROM Resultado) AS hallazgos`,
  );
  const fila = filas[0];
  return {
    proyectos: Number(fila.proyectos),
    analisis: Number(fila.analisis),
    hallazgos: Number(fila.hallazgos),
  };
}
