// PROMPT — middlewares/error-handler.ts
//
// 1) Definir y exportar la clase `AppError extends Error` con (status, codigo, mensaje).
// 2) Middleware de 4 parámetros (err, req, res, next) que responde SIEMPRE el formato estándar: { error: { codigo, mensaje } }.
// Mapeo: AppError → su status/codigo · ZodError → 400 DATOS_INVALIDOS (mensaje con el primer problema) · error de mysql2 ER_DUP_ENTRY → 409 · cualquier otro → 500 ERROR_INTERNO (sin exponer el stack al cliente; registrarlo con logger.error).
// Referencia: docs/api-contract.md (sección "Error estándar")
// Hecho cuando: un throw new AppError(409,"RUTA_DUPLICADA","...") dentro de un service llega al cliente como 409 con ese JSON.
