// PROMPT — revisiones.service.ts — Lógica de negocio de revisiones (HU-05)
//
// crear: proyecto inexistente → 404; si tipo_objetivo="archivo", el archivo debe pertenecer al proyecto (si no, 400).
// Re-escanear con scanner.service, crear SolicitudRevision y Analisis (estado "pendiente", modelo_ia_usado = Proyecto.modelo_ia) en UNA transacción.
// Luego disparar analisis.service.ejecutar(id_analisis) SIN await (segundo plano) y responder de inmediato.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis
