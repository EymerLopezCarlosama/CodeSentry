// PROMPT — revisiones.routes.ts — Rutas HTTP de revisiones (HU-05)
//
// Router con POST /revisiones (validate → controller). Exportar el router.
//
// Solo define rutas: sin lógica ni SQL.
//
// Depende de: validators + controllers del mismo dominio, middlewares/validate.ts
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis

import { Router } from "express";
import * as controller from "../controllers/revisiones.controller";
import { validate } from "../middlewares/validate";
import { crearRevisionSchema } from "../validators/revisiones.validator";

export const revisionesRouter = Router();

revisionesRouter.post("/", validate({ body: crearRevisionSchema }), controller.crear);