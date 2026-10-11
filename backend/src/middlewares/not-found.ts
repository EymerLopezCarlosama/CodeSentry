import { Request, Response } from "express";

export const notFound = (req: Request, res: Response) =>
  res.status(404).json({
    error: { codigo: "RUTA_NO_ENCONTRADA", mensaje: `No existe ${req.method} ${req.originalUrl}` },
  });