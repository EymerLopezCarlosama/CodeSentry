// PROMPT — services/resultados.service.ts — Resultados (HU-07)
//
// Funciones: obtener(idAnalisis, severidad?) → hallazgos agrupados por archivo.
// Cada función usa api<T>() de services/api.ts y devuelve tipos de types/index.ts. Sin lógica de pantalla.
//
// Depende de: services/api.ts, types/index.ts
// Referencia: docs/api-contract.md (sección "Resultados")

import { api } from "./api";
import type { ResultadosAgrupados, Severidad } from "../types";

export function obtener(idAnalisis: number, severidad?: Severidad): Promise<ResultadosAgrupados> {
  const consulta = severidad ? `?severidad=${encodeURIComponent(severidad)}` : "";
  return api<ResultadosAgrupados>(`/analisis/${idAnalisis}/resultados${consulta}`);
}