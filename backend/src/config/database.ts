// PROMPT — config/database.ts
//
// Crear el pool de mysql2/promise con los datos de env (connectionLimit 10, dateStrings: true para que las fechas lleguen como "YYYY-MM-DD", tal como pide el contrato).
// Exportar `pool` y `probarConexion(): Promise<boolean>` (hace SELECT 1; la usa /salud y server.ts).
//
// Depende de: config/env.ts
// Referencia: database/schema.sql
// Hecho cuando: probarConexion() devuelve true con el contenedor Docker codesentry-db encendido (puerto 3307) y la BD codesentry creada.
