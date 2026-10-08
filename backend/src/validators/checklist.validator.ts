// PROMPT — checklist.validator.ts — Validación de entrada (zod) de checklist (HU-09)
//
// patch: body { estado: "pendiente"|"aceptada"|"rechazada" } · params: id.
//
// Esquemas zod con mensajes en español. Se aplican con middlewares/validate.ts.
//
// Depende de: zod (solo esquemas, sin lógica)
// Referencia: docs/api-contract.md (sección "Checklist") · tablas: ChecklistItem, Resultado, Estado
