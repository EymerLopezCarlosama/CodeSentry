// PROMPT — dashboard.service.ts — Lógica de negocio de dashboard (HU-10)
//
// Armar la respuesta del contrato. Las claves sin datos van en 0 (por_severidad siempre trae baja/media/alta/critica; checklist siempre trae pendiente/aceptada/rechazada).
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Dashboard") · tablas: Proyecto, Analisis, Resultado, ChecklistItem

import * as dashboardRepository from "../repositories/dashboard.repository";
import { DashboardRespuesta } from "../types";

export async function obtener(): Promise<DashboardRespuesta> {
  const [totales, severidades, checklist, porProyecto] = await Promise.all([
    dashboardRepository.contarTotales(),
    dashboardRepository.contarPorSeveridad(),
    dashboardRepository.contarChecklist(),
    dashboardRepository.detallePorProyecto(),
  ]);

  return {
    totales,
    por_severidad: {
      baja: severidades.baja ?? 0,
      media: severidades.media ?? 0,
      alta: severidades.alta ?? 0,
      critica: severidades.critica ?? 0,
    },
    checklist: {
      pendiente: checklist.pendiente ?? 0,
      aceptada: checklist.aceptada ?? 0,
      rechazada: checklist.rechazada ?? 0,
    },
    por_proyecto: porProyecto,
  };
}