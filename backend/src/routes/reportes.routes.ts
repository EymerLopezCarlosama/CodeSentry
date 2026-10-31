import { Router } from "express";
import * as controller from "../controllers/reportes.controller";
import { validate } from "../middlewares/validate";
import { generarReporteSchema, idParamSchema } from "../validators/reportes.validator";

export const reportesRouter = Router();

reportesRouter.post(
  "/analisis/:id/reportes",
  validate({ params: idParamSchema, body: generarReporteSchema }),
  controller.generar
);

reportesRouter.get(
  "/analisis/:id/reportes",
  validate({ params: idParamSchema }),
  controller.listar
);

reportesRouter.get(
  "/reportes/:id/descargar",
  validate({ params: idParamSchema }),
  controller.descargar
);