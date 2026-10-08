// PROMPT — resultados.repository.ts — Acceso a datos (SQL) de resultados (HU-07)
//
// Resultado JOIN Archivo JOIN ChecklistItem JOIN Estado filtrando por id_analisis y severidad opcional; ORDER BY FIELD(severidad,"critica","alta","media","baja").
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem
