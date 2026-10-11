import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class AppError extends Error {
  constructor(public status: number, public codigo: string, mensaje: string) {
    super(mensaje);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { codigo: "DATOS_INVALIDOS", mensaje: err.issues[0]?.message ?? "Datos inválidos." },
    });
  }
  if ((err as { code?: string })?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ error: { codigo: "REGISTRO_DUPLICADO", mensaje: "El registro ya existe." } });
  }
  logger.error(err);
  return res.status(500).json({ error: { codigo: "ERROR_INTERNO", mensaje: "Error interno del servidor." } });
}