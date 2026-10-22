// PROMPT — revisiones.controller.ts — Controlador de revisiones (HU-05)
//
// crear: responde 202 con { id_solicitud, id_analisis, estado: "pendiente" }. No espera a que termine el análisis.
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis

import { NextFunction, Request, Response } from "express";
import * as revisionesService from "../services/revisiones.service";

export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const revision = await revisionesService.crear(req.body);
    res.status(202).json(revision);
  } catch (err) {
    next(err);
  }
}