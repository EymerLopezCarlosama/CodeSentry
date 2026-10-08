// PROMPT — revisiones.repository.ts — Acceso a datos (SQL) de revisiones (HU-05)
//
// insertarSolicitud, insertarAnalisis (usar la misma conexión/transacción), obtenerSolicitud.
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis
