// PROMPT — resultados.service.ts — Lógica de negocio de resultados (HU-07)
//
// Análisis inexistente → 404. Si el análisis NO está "completado": devolver { estado real, archivos: [] } (NO es un error).
// Agrupar hallazgos por archivo y ordenarlos por severidad (critica → alta → media → baja). Cada hallazgo lleva estado_checklist.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem
