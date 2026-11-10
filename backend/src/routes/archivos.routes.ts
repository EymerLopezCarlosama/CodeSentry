import { Router } from "express";
import * as controller from "../controllers/archivos.controller";
import { validate } from "../middlewares/validate";
import { idParamSchema } from "../validators/archivos.validator";

const router = Router();

router.post("/:id/pruebas", validate({ params: idParamSchema }), controller.generarPruebas);
router.post("/:id/documentacion", validate({ params: idParamSchema }), controller.generarDocumentacion);

export default router;