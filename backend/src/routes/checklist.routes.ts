import { Router } from "express";
import * as controller from "../controllers/checklist.controller";
import { validate } from "../middlewares/validate";
import { idParamSchema, marcarChecklistSchema } from "../validators/checklist.validator";

export const checklistRouter = Router();

checklistRouter.get(
  "/analisis/:id/checklist",
  validate({ params: idParamSchema }),
  controller.listar
);

checklistRouter.patch(
  "/checklist/:id",
  validate({ params: idParamSchema, body: marcarChecklistSchema }),
  controller.marcar
);