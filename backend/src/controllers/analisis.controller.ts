// PROMPT — analisis.controller.ts — Controlador de análisis (HU-06)
//
// obtener: 200 con { id_analisis, estado, modelo_ia_usado, fecha_analisis, progreso: { procesados, total } }.
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Análisis") · tablas: Analisis, Resultado, ChecklistItem
