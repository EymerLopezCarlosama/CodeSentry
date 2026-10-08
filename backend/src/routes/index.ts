// PROMPT — routes/index.ts
//
// Router raíz (montado en /api). Montar los routers de proyectos, revisiones, analisis, resultados, checklist, reportes y dashboard.
// Definir aquí las utilidades: GET /salud → { backend, base_datos, analyzer, ollama } (cada uno "ok" o "error"; usa probarConexion y analyzer-client.salud) y GET /modelos → modelos de Ollama (analyzer-client.modelos).
// Referencia: docs/api-contract.md (secciones "Utilidades")
// Hecho cuando: /api/salud muestra el estado real de los cuatro componentes aunque alguno esté apagado.
