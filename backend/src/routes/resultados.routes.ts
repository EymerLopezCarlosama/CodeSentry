// PROMPT — resultados.routes.ts — Rutas HTTP de resultados (HU-07)
//
// Router con GET /analisis/:id/resultados (query opcional ?severidad=). Exportar el router.
//
// Solo define rutas: sin lógica ni SQL.
//
// Depende de: validators + controllers del mismo dominio, middlewares/validate.ts
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem

import { Router } from "express";
import * as controller from "../controllers/resultados.controller";
import { validate } from "../middlewares/validate";
import {
  idAnalisisParamSchema,
  listarResultadosQuerySchema,
} from "../validators/resultados.validator";

export const resultadosRouter = Router();

resultadosRouter.get(
  "/analisis/:id/resultados",
  validate({ params: idAnalisisParamSchema, query: listarResultadosQuerySchema }),
  controller.listar
);