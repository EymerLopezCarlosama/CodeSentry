import { NextFunction, Request, Response } from "express";
import * as analisisService from "../services/analisis.service";

export async function obtener(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.status(200).json(await analisisService.obtener(req.params.id as unknown as number));
  } catch (err) {
    next(err);
  }
}

export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // query ya validada por listarAnalisisQuerySchema
    const { proyecto, limite } = req.query as unknown as { proyecto?: number; limite?: number };
    res.status(200).json(await analisisService.listar({ idProyecto: proyecto, limite }));
  } catch (err) {
    next(err);
  }
}
