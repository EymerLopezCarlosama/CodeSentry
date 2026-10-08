// PROMPT — checklist.service.ts — Lógica de negocio de checklist (HU-09)
//
// listar: cada item con código afectado (ruta_relativa + linea_codigo), recomendación (descripcion del Resultado) y estado.
// marcar: buscar el id_estado por nombre con contexto "checklist"; actualizar ChecklistItem.id_estado y fecha_marcado = hoy (NULL si vuelve a "pendiente"). Item inexistente → 404.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Checklist") · tablas: ChecklistItem, Resultado, Estado
