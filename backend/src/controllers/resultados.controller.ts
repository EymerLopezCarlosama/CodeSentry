// PROMPT — resultados.controller.ts — Controlador de resultados (HU-07)
//
// listar: 200 con { estado, archivos: [ { ruta_relativa, hallazgos: [...] } ] }.
//
// Sin SQL ni reglas de negocio: extrae params/body ya validados, llama al service y responde con el status del contrato. Errores → next(err).
//
// Depende de: services del mismo dominio
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem

import { NextFunction, Request, Response } from "express";
import * as resultadosService from "../services/resultados.service";
import type { Severidad } from "../types";

export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // params y query ya pasaron por los esquemas de resultados.validator.ts
    const severidad = req.query.severidad as Severidad | undefined;
    const resultado = await resultadosService.listar(Number(req.params.id), severidad);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
}