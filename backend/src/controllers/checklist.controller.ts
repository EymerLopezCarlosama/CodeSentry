// PROMPT — checklist.controller.ts — Controlador de checklist (HU-09)
//
// listar (200) y marcar (200 + item actualizado).
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Checklist") · tablas: ChecklistItem, Resultado, Estado
