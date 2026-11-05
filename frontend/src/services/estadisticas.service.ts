import { api } from "./api";
import type { EstadisticaRegla } from "../types";

export function porRegla(): Promise<EstadisticaRegla[]> {
  return api<EstadisticaRegla[]>("/reglas/estadisticas");
}