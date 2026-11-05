import { Router } from "express";
import * as controller from "../controllers/estadisticas.controller";

export const estadisticasRouter = Router();

estadisticasRouter.get("/reglas/estadisticas", controller.porRegla);