// PROMPT — dashboard.repository.ts — Acceso a datos (SQL) de dashboard (HU-10)
//
// COUNTs de proyectos/análisis/hallazgos, GROUP BY severidad, GROUP BY estado de checklist y el detalle por proyecto (cadena Proyecto → SolicitudRevision → Analisis → Resultado → ChecklistItem).
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Dashboard") · tablas: Proyecto, Analisis, Resultado, ChecklistItem
