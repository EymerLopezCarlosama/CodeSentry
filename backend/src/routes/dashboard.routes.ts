// PROMPT — dashboard.routes.ts — Rutas HTTP de dashboard (HU-10)
//
// Router con GET /dashboard. Exportar el router.
//
// Solo define rutas: sin lógica ni SQL.
//
// Depende de: validators + controllers del mismo dominio, middlewares/validate.ts
// Referencia: docs/api-contract.md (sección "Dashboard") · tablas: Proyecto, Analisis, Resultado, ChecklistItem

import { Router } from "express";
import * as controller from "../controllers/dashboard.controller";
import { validate } from "../middlewares/validate";
import { dashboardQuerySchema } from "../validators/dashboard.validator";

export const dashboardRouter = Router();

dashboardRouter.get("/", validate({ query: dashboardQuerySchema }), controller.obtener);