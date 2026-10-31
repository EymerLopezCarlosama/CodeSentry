import { NextFunction, Request, Response } from "express";
import * as reportesService from "../services/reportes.service";

// POST /analisis/:id/reportes
export async function generar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reporte = await reportesService.generar(Number(req.params.id), req.body.formato);
    res.status(201).json(reporte);
  } catch (err) {
    next(err);
  }
}

// GET /analisis/:id/reportes
export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reportes = await reportesService.listar(Number(req.params.id));
    res.status(200).json(reportes);
  } catch (err) {
    next(err);
  }
}

// GET /reportes/:id/descargar
export async function descargar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reporte = await reportesService.descargar(Number(req.params.id));
    res.download(reporte.ruta_archivo, (err) => {
      if (err && !res.headersSent) next(err);
    });
  } catch (err) {
    next(err);
  }
}