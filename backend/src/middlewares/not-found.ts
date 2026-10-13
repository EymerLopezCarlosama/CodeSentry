import { Request, Response } from "express";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      codigo: "RUTA_NO_ENCONTRADA",
      mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.`,
    },
  });
}