import { NextFunction, Request, Response } from "express";
import * as sistemaService from "../services/sistema.service";

export async function seleccionarCarpeta(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ruta = await sistemaService.seleccionarCarpeta();
    if (ruta === null) {
      res.status(204).send();
      return;
    }
    res.status(200).json({ ruta });
  } catch (err) {
    next(err);
  }
}