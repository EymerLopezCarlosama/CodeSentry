// PROMPT — types/index.ts
//
// Tipos compartidos por controllers/services/repositories. Mantenerlos IGUAL a database/schema.sql y a las respuestas del contrato:
// - Uniones literales: Severidad (baja|media|alta|critica), TipoHallazgo (vulnerabilidad|mala_practica|refactorizacion), CodigoLenguaje (js|ts|py), NombreLenguaje (JavaScript|TypeScript|Python), EstadoAnalisis (pendiente|en_proceso|completado|fallido), EstadoChecklist (pendiente|aceptada|rechazada), FormatoReporte (pdf|html|json).
// - Interfaces de fila de BD: Estado, Lenguaje, Proyecto (incluye modelo_ia), Archivo, SolicitudRevision, Analisis, Resultado (incluye id_archivo), ChecklistItem, Reporte.
// - Interfaces de respuesta de la API: ProyectoRespuesta, AnalisisRespuesta (con progreso), ResultadosAgrupados, DashboardRespuesta.
// Referencia: docs/api-contract.md · database/schema.sql
// Hecho cuando: ningún service usa `any` para entidades de la BD.
