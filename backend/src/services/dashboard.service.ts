// PROMPT — dashboard.service.ts — Lógica de negocio de dashboard (HU-10)
//
// Armar la respuesta del contrato. Las claves sin datos van en 0 (por_severidad siempre trae baja/media/alta/critica; checklist siempre trae pendiente/aceptada/rechazada).
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Dashboard") · tablas: Proyecto, Analisis, Resultado, ChecklistItem
