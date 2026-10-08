// PROMPT — app.ts
//
// Exportar `app` (Express) SIN llamar a listen (así se puede probar con supertest).
// Orden: cors({ origin: "http://localhost:5173" }) → express.json() → app.use("/api", routes) → notFound → errorHandler.
//
// Depende de: routes/index.ts, middlewares/not-found.ts, middlewares/error-handler.ts
// Hecho cuando: GET http://localhost:3001/api/salud responde JSON.
