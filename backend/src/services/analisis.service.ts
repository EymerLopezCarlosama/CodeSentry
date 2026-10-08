// PROMPT — analisis.service.ts — Lógica de negocio de análisis (HU-06)
//
// ejecutar(idAnalisis) — corre en segundo plano: estado "en_proceso" → analyzer-client.crearTrabajo (ruta_base del proyecto, objetivo, ruta_relativa del archivo si aplica, modelo, lenguajes en js/ts/py) → consultar cada 2 s.
// Guardar el progreso en un Map en memoria (no va a la BD). Al terminar: en UNA transacción insertar cada hallazgo como Resultado (resolviendo id_archivo por ruta_relativa) y crear su ChecklistItem "pendiente"; luego estado "completado" (o "fallido" si el analyzer lo indica o se cae).
// obtener(id): estado de BD + progreso del Map; inexistente → 404.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Análisis") · tablas: Analisis, Resultado, ChecklistItem
