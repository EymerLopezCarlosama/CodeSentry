// PROMPT — analisis.repository.ts — Acceso a datos (SQL) de análisis (HU-06)
//
// obtenerPorId (JOIN Estado), cambiarEstado, obtenerContexto (proyecto + solicitud + archivo para armar la llamada al analyzer), insertarResultadosConChecklist (transacción).
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Análisis") · tablas: Analisis, Resultado, ChecklistItem
