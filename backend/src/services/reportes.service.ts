// PROMPT — reportes.service.ts — Lógica de negocio de reportes (HU-08)
//
// Solo si el análisis está "completado" (si no, 409 ANALISIS_NO_COMPLETADO).
// Contenido: total de hallazgos, distribución por severidad y por archivo, fecha del análisis.
// Generar el archivo en env.REPORTS_DIR y registrar la fila en Reporte. Empezar con "json" y "html"; "pdf" va al final (necesitará agregar una librería como pdfkit a package.json).
// descargar: validar que el archivo siga existiendo en disco (si no, 404).
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Reportes") · tablas: Reporte, Resultado
