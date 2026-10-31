import { Router } from "express";
import * as controller from "../controllers/resultados.controller";
import { validate } from "../middlewares/validate";
import {
  codigoQuerySchema,
  idAnalisisParamSchema,
  idResultadoParamSchema,
  listarResultadosQuerySchema,
} from "../validators/resultados.validator";

export const resultadosRouter = Router();

resultadosRouter.get(
  "/analisis/:id/resultados",
  validate({ params: idAnalisisParamSchema, query: listarResultadosQuerySchema }),
  controller.listar
);

resultadosRouter.get(
  "/resultados/:id/codigo",
  validate({ params: idResultadoParamSchema, query: codigoQuerySchema }),
  controller.obtenerCodigo
);