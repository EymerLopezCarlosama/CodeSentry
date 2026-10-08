// PROMPT — proyectos.controller.ts — Controlador de proyectos (HU-01 a HU-04)
//
// Funciones async (req,res,next): listar (200), obtener (200), crear (201 + proyecto), actualizar (200 + proyecto), eliminar (204 sin cuerpo), listarArchivos (200).
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Proyectos") · tablas: Proyecto, Proyecto_Lenguaje, Lenguaje, Estado
