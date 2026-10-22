import { Router } from "express";
import * as controller from "../controllers/proyectos.controller";
import { validate } from "../middlewares/validate";
import {
  actualizarProyectoSchema,
  crearProyectoSchema,
  idParamSchema,
} from "../validators/proyectos.validator";

export const proyectosRouter = Router();

proyectosRouter.get("/", controller.listar);

proyectosRouter.get("/:id", validate({ params: idParamSchema }), controller.obtener);

proyectosRouter.post("/", validate({ body: crearProyectoSchema }), controller.crear);

proyectosRouter.put(
  "/:id",
  validate({ params: idParamSchema, body: actualizarProyectoSchema }),
  controller.actualizar
);

proyectosRouter.delete("/:id", validate({ params: idParamSchema }), controller.eliminar);
proyectosRouter.get("/:id/archivos", validate({ params: idParamSchema }), controller.listarArchivos);