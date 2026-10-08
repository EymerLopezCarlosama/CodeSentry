// PROMPT — hooks/useAnalisis.ts
//
// Hook para lanzar y seguir un análisis: iniciar(idProyecto, objetivo, idArchivo?) crea la revisión y luego consulta GET /analisis/:id cada 2 s hasta que el estado sea "completado" o "fallido".
// Expone { estado, progreso, error, iniciar }. Debe limpiar el intervalo al desmontar el componente.
//
// Depende de: services/revisiones.service.ts
// Referencia: docs/api-contract.md (sección "Análisis") · HU-06
// Hecho cuando: la barra de progreso se mueve sola mientras la IA analiza.
