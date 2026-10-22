import { NextFunction, Request, Response, Router } from "express";
import { z } from "zod";
import { sistemaRouter } from "./sistema.routes";
import { probarConexion } from "../config/database";
import { validate } from "../middlewares/validate";
import * as analyzerClient from "../services/analyzer-client.service";
import { proyectosRouter } from "./proyectos.routes";
import { dashboardRouter } from "./dashboard.routes";
import { checklistRouter } from "./checklist.routes";
import { analisisRouter } from "./analisis.routes";
import { revisionesRouter } from "./revisiones.routes";

export const routes = Router();

const modeloSchema = z.object({
  modelo: z
    .string({ required_error: "El modelo es obligatorio." })
    .trim()
    .min(1, "El modelo es obligatorio.")
    .max(50, "El modelo admite máximo 50 caracteres."),
});

// Utilidades (docs/api-contract.md, sección "Utilidades")
routes.get("/salud", async (_req, res) => {
  const [baseDatos, analyzer] = await Promise.all([probarConexion(), analyzerClient.salud()]);
  res.json({
    backend: "ok",
    base_datos: baseDatos ? "ok" : "error",
    analyzer: analyzer.analyzer,
    ollama: analyzer.ollama,
  });
});

routes.get("/modelos", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await analyzerClient.modelos());
  } catch (err) {
    next(err);
  }
});

routes.post(
  "/modelos/instalar",
  validate({ body: modeloSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, datos } = await analyzerClient.instalarModelo(req.body.modelo);
      res.status(status).json(datos); // 200 si ya estaba instalado, 202 si descarga
    } catch (err) {
      next(err);
    }
  },
);

routes.get(
  "/modelos/instalar",
  validate({ query: modeloSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await analyzerClient.estadoInstalacion(String(req.query.modelo)));
    } catch (err) {
      next(err);
    }
  },
);

routes.use("/proyectos", proyectosRouter);
routes.use("/dashboard", dashboardRouter);
routes.use(checklistRouter);
routes.use(analisisRouter);
routes.use("/sistema", sistemaRouter);
routes.use("/revisiones", revisionesRouter);