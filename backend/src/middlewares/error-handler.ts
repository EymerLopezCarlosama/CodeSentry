import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export class AppError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    mensaje: string
  ) {
    super(mensaje);
    this.name = "AppError";
  }
}

function esDuplicadoMysql(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "ER_DUP_ENTRY"
  );
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { codigo: err.codigo, mensaje: err.message } });
    return;
  }

  if (err instanceof ZodError) {
    const primero = err.issues[0];
    const campo = primero.path.join(".");
    const mensaje = campo ? `${campo}: ${primero.message}` : primero.message;
    res.status(400).json({ error: { codigo: "DATOS_INVALIDOS", mensaje } });
    return;
  }

  if (esDuplicadoMysql(err)) {
    res.status(409).json({
      error: { codigo: "REGISTRO_DUPLICADO", mensaje: "Ya existe un registro con esos datos." },
    });
    return;
  }

  logger.error("Error no controlado:", err);
  res.status(500).json({
    error: { codigo: "ERROR_INTERNO", mensaje: "Ocurrió un error interno del servidor." },
  });
}