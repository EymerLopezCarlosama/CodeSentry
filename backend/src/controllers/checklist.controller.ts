import { NextFunction, Request, Response } from "express";
import * as checklistService from "../services/checklist.service";

// GET /analisis/:id/checklist
export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await checklistService.listar(Number(req.params.id));
    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}

// PATCH /checklist/:id
export async function marcar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await checklistService.marcar(Number(req.params.id), req.body.estado);
    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
}