// PROMPT — dashboard.controller.ts — Controlador de dashboard (HU-10)
//
// obtener: 200 con { totales, por_severidad, checklist, por_proyecto }.
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Dashboard") · tablas: Proyecto, Analisis, Resultado, ChecklistItem

import { NextFunction, Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function obtener(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await dashboardService.obtener();
    res.status(200).json(dashboard);
  } catch (err) {
    next(err);
  }
}