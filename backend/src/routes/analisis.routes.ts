import { Router } from "express";
import * as analisisController from "../controllers/analisis.controller";
import { validate } from "../middlewares/validate";
import { idParamSchema, listarAnalisisQuerySchema } from "../validators/analisis.validator";

export const analisisRouter = Router();

analisisRouter.get("/analisis", validate({ query: listarAnalisisQuerySchema }), analisisController.listar);
analisisRouter.get("/analisis/:id", validate({ params: idParamSchema }), analisisController.obtener);