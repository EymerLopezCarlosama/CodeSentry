import { api } from "./api";

export type EstadoSalud = "ok" | "error";

export interface Salud {
  backend: EstadoSalud;
  base_datos: EstadoSalud;
  analyzer: EstadoSalud;
  ollama: EstadoSalud;
}

export function obtenerSalud() {
  return api<Salud>("/salud");
}