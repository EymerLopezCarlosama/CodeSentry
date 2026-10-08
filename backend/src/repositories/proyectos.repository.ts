// PROMPT — proyectos.repository.ts — Acceso a datos (SQL) de proyectos (HU-01 a HU-04)
//
// listar y obtenerPorId (JOIN con Estado; lenguajes vía Proyecto_Lenguaje), obtenerPorRuta, insertar (transacción: Proyecto + Proyecto_Lenguaje), actualizar, eliminar.
// Funciones de Archivo para scanner.service: upsertArchivos, listarArchivosPorProyecto. Helper obtenerIdEstado(nombre, contexto).
//
// SOLO SQL con parámetros (?) usando el pool de mysql2. Nunca concatenar texto del usuario en el SQL. Devuelve tipos de types/index.ts.
//
// Depende de: config/database.ts (pool), types/index.ts
// Referencia: docs/api-contract.md (sección "Proyectos") · tablas: Proyecto, Proyecto_Lenguaje, Lenguaje, Estado
