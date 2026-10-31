// Resultados (HU-07): hallazgos agrupados por archivo y fragmento de código de un hallazgo.
// Depende de: services/api.ts, types/index.ts
// Referencia: docs/api-contract.md (sección "Resultados")

import { api } from "./api";
import type { FragmentoCodigo, ResultadosAgrupados, Severidad } from "../types";

export function obtener(idAnalisis: number, severidad?: Severidad): Promise<ResultadosAgrupados> {
  const consulta = severidad ? `?severidad=${encodeURIComponent(severidad)}` : "";
  return api<ResultadosAgrupados>(`/analisis/${idAnalisis}/resultados${consulta}`);
}

// Código alrededor de la línea de un hallazgo (solo lectura). `contexto` = líneas a cada lado.
export function obtenerCodigo(idResultado: number, contexto?: number): Promise<FragmentoCodigo> {
  const consulta = contexto !== undefined ? `?contexto=${contexto}` : "";
  return api<FragmentoCodigo>(`/resultados/${idResultado}/codigo${consulta}`);
}