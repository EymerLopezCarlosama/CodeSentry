// PROMPT — services/analyzer-client.service.ts
//
// Cliente HTTP (fetch nativo de Node 20) hacia ANALYZER_URL. Funciones: salud(), modelos(), crearTrabajo(entrada) → { job_id }, consultarTrabajo(job_id) → estado/progreso/resultados/omitidos/errores.
// Tipos de entrada y salida según el contrato del analyzer. Timeout de 10 s por llamada (el análisis es asíncrono: aquí nunca se espera el análisis completo).
// Si el analyzer no responde → AppError(502, "ANALYZER_NO_DISPONIBLE"). Si responde con un código propio (OLLAMA_NO_DISPONIBLE, MODELO_NO_INSTALADO, RUTA_INEXISTENTE) reenviarlo con status 502 y ese mismo código.
//
// Depende de: config/env.ts, middlewares/error-handler.ts (AppError)
// Referencia: docs/analyzer-contract.md
// Hecho cuando: con el analyzer apagado, salud() devuelve error sin tumbar el backend.
