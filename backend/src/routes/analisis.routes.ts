import { Router } from "express";
import * as analisisController from "../controllers/analisis.controller";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validators/analisis.validator";

export const analisisRouter = Router();

analisisRouter.get("/analisis/:id", validate({ params: idParamSchema }), analisisController.obtener);