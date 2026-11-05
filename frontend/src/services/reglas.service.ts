import { api } from "./api";
import type { ReglaCatalogo } from "../types";

// El catálogo casi no cambia: se pide una sola vez por sesión
let cache: Promise<ReglaCatalogo[]> | null = null;

export function listar(): Promise<ReglaCatalogo[]> {
  if (!cache) {
    cache = api<ReglaCatalogo[]>("/reglas").catch(() => {
      cache = null;
      return [];
    });
  }
  return cache;
}