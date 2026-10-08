// PROMPT — proyectos.validator.ts — Validación de entrada (zod) de proyectos (HU-01 a HU-04)
//
// crearProyectoSchema: nombre (1–100), ruta_carpeta (1–255), lenguajes (array ≥1 de "JavaScript"|"TypeScript"|"Python"), modelo_ia (opcional, ≤50).
// actualizarProyectoSchema: los mismos campos opcionales, pero al menos uno. idParamSchema: id entero positivo (z.coerce.number()).
//
// Esquemas zod con mensajes en español. Se aplican con middlewares/validate.ts.
//
// Depende de: zod (solo esquemas, sin lógica)
// Referencia: docs/api-contract.md (sección "Proyectos") · tablas: Proyecto, Proyecto_Lenguaje, Lenguaje, Estado
