// PROMPT — proyectos.service.ts — Lógica de negocio de proyectos (HU-01 a HU-04)
//
// crear: normalizar ruta → si no existe 400 RUTA_INEXISTENTE → si ya está registrada 409 RUTA_DUPLICADA → estado inicial "activo" → modelo_ia por defecto "qwen2.5-coder" si no viene.
// actualizar: cualquier campo del contrato; si cambia la ruta repetir las dos validaciones; poner fecha_actualizacion = hoy.
// eliminar: SOLO el registro en BD (cascada a solicitudes). Nunca tocar archivos del disco. obtener inexistente → 404.
// Devolver la forma del contrato: lenguajes como lista de nombres, estado como nombre_estado.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Proyectos") · tablas: Proyecto, Proyecto_Lenguaje, Lenguaje, Estado
