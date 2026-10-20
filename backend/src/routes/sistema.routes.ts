import { Router } from "express";
import * as controller from "../controllers/sistema.controller";

export const sistemaRouter = Router();

sistemaRouter.get("/seleccionar-carpeta", controller.seleccionarCarpeta);