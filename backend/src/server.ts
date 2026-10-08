// PROMPT — server.ts
//
// Punto de entrada: importa env y app, verifica la BD con probarConexion() (si falla, avisa claro pero deja arrancar), hace app.listen(env.BACKEND_PORT) y registra con logger.
// Al recibir SIGINT cerrar el pool de MySQL antes de salir.
//
// Depende de: config/env.ts, config/database.ts, app.ts
// Hecho cuando: `npm run dev` deja el servidor escuchando en el puerto de .env.
