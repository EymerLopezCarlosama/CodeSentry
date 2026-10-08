// PROMPT — reportes.controller.ts — Controlador de reportes (HU-08)
//
// generar (201 + { id_reporte, formato, ruta_archivo }), listar (200), descargar (res.download del archivo).
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Reportes") · tablas: Reporte, Resultado
