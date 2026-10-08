// PROMPT — checklist.repository.ts — Acceso a datos (SQL) de checklist (HU-09)
//
// listarPorAnalisis, obtenerPorId, actualizarEstado, obtenerIdEstado(nombre, contexto).
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Checklist") · tablas: ChecklistItem, Resultado, Estado
