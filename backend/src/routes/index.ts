import { Router } from "express";
import { probarConexion } from "../config/database";
import { proyectosRouter } from "./proyectos.routes";
import { dashboardRouter } from "./dashboard.routes";
import { checklistRouter } from "./checklist.routes";

export const routes = Router();

routes.get("/salud", async (_req, res) => {
  const baseDatos = await probarConexion();
  res.json({
    backend: "ok",
    base_datos: baseDatos ? "ok" : "error",
  });
});

routes.use("/proyectos", proyectosRouter);
routes.use("/dashboard", dashboardRouter);
routes.use(checklistRouter);