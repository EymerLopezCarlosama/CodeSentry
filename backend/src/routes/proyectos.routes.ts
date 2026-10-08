// PROMPT — proyectos.routes.ts — Rutas HTTP de proyectos (HU-01 a HU-04)
//
// Router de /proyectos con: GET / · GET /:id · POST / · PUT /:id · DELETE /:id · GET /:id/archivos.
// Cada ruta: validate(...) → controller. Exportar el router (se monta en routes/index.ts).
//
// Solo define rutas: sin lógica ni SQL.
//
// Depende de: validators + controllers del mismo dominio, middlewares/validate.ts
// Referencia: docs/api-contract.md (sección "Proyectos") · tablas: Proyecto, Proyecto_Lenguaje, Lenguaje, Estado
