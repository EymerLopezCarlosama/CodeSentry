// PROMPT — services/revisiones.service.ts — Revisiones y análisis (HU-05, HU-06)
//
// Funciones: crear({ id_proyecto, tipo_objetivo, id_archivo? }) → { id_solicitud, id_analisis, estado } y obtenerAnalisis(idAnalisis) → estado + progreso (GET /analisis/:id). No hay service de "analisis" aparte: va aquí.
// Cada función usa api<T>() de services/api.ts y devuelve tipos de types/index.ts. Sin lógica de pantalla.
//
// Depende de: services/api.ts, types/index.ts
// Referencia: docs/api-contract.md (sección "Revisiones")

import { api } from "./api";
import type { Analisis, DatosNuevaRevision, RevisionCreada } from "../types";

export function crear(datos: DatosNuevaRevision): Promise<RevisionCreada> {
  return api<RevisionCreada>("/revisiones", { method: "POST", body: datos });
}

export function obtenerAnalisis(idAnalisis: number): Promise<Analisis> {
  return api<Analisis>(`/analisis/${idAnalisis}`);
}