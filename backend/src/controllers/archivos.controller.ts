import { NextFunction, Request, Response } from "express";
import * as archivosService from "../services/archivos.service";

export async function generarPruebas(req: Request, res: Response, next: NextFunction) {
  try {
    const resultado = await archivosService.generarPruebas(Number(req.params.id));
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function generarDocumentacion(req: Request, res: Response, next: NextFunction) {
  try {
    const resultado = await archivosService.generarDocumentacion(Number(req.params.id));
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}
