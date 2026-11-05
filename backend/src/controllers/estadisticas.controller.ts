import { NextFunction, Request, Response } from "express";
import * as estadisticasService from "../services/estadisticas.service";

export async function porRegla(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await estadisticasService.obtener());
  } catch (err) {
    next(err);
  }
}