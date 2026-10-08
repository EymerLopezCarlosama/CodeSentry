// PROMPT — resultados.controller.ts — Controlador de resultados (HU-07)
//
// listar: 200 con { estado, archivos: [ { ruta_relativa, hallazgos: [...] } ] }.
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem
