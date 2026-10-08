// PROMPT — revisiones.validator.ts — Validación de entrada (zod) de revisiones (HU-05)
//
// crearRevisionSchema: { id_proyecto, tipo_objetivo: "carpeta"|"archivo", id_archivo? } con refine: id_archivo obligatorio si es "archivo" y prohibido si es "carpeta".
//
// Esquemas zod con mensajes en español. Se aplican con middlewares/validate.ts.
//
// Depende de: zod (solo esquemas, sin lógica)
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis
