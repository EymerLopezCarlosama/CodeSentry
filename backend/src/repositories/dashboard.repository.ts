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
import { DashboardRespuesta, EstadoChecklist, Severidad } from "../types";

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

export async function contarPorSeveridad(): Promise<Partial<Record<Severidad, number>>> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT severidad, COUNT(*) AS total FROM Resultado GROUP BY severidad"
  );
  const resultado: Partial<Record<Severidad, number>> = {};
  for (const fila of filas) {
    resultado[fila.severidad as Severidad] = Number(fila.total);
  }
  return resultado;
}

export async function contarChecklist(): Promise<Partial<Record<EstadoChecklist, number>>> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT e.nombre_estado AS estado, COUNT(*) AS total
      FROM ChecklistItem c
      JOIN Estado e ON e.id_estado = c.id_estado
      GROUP BY e.nombre_estado`
  );
  const resultado: Partial<Record<EstadoChecklist, number>> = {};
  for (const fila of filas) {
    resultado[fila.estado as EstadoChecklist] = Number(fila.total);
  }
  return resultado;
}

export async function detallePorProyecto(): Promise<DashboardRespuesta["por_proyecto"]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT p.id_proyecto, p.nombre,
            COUNT(DISTINCT r.id_resultado) AS hallazgos,
            SUM(CASE WHEN e.nombre_estado = 'aceptada'  THEN 1 ELSE 0 END) AS aceptadas,
            SUM(CASE WHEN e.nombre_estado = 'rechazada' THEN 1 ELSE 0 END) AS rechazadas
      FROM Proyecto p
      LEFT JOIN SolicitudRevision s ON s.id_proyecto = p.id_proyecto
      LEFT JOIN Analisis a          ON a.id_solicitud = s.id_solicitud
      LEFT JOIN Resultado r         ON r.id_analisis  = a.id_analisis
      LEFT JOIN ChecklistItem c     ON c.id_resultado = r.id_resultado
      LEFT JOIN Estado e            ON e.id_estado    = c.id_estado
      GROUP BY p.id_proyecto, p.nombre
      ORDER BY p.id_proyecto`
  );
  return filas.map((fila) => ({
    id_proyecto: Number(fila.id_proyecto),
    nombre: String(fila.nombre),
    hallazgos: Number(fila.hallazgos),
    aceptadas: Number(fila.aceptadas),
    rechazadas: Number(fila.rechazadas),
  }));
}