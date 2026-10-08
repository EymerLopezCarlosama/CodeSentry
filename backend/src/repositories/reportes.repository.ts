// PROMPT — reportes.repository.ts — Acceso a datos (SQL) de reportes (HU-08)
//
// insertar, listarPorAnalisis, obtenerPorId, datosParaReporte (conteos agregados por severidad y por archivo).
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Reportes") · tablas: Reporte, Resultado
