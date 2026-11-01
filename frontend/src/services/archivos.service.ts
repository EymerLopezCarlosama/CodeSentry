import { api } from "./api";
import type { PruebasGeneradas } from "../types";

export function generarPruebas(idArchivo: number) {
  return api<PruebasGeneradas>(`/archivos/${idArchivo}/pruebas`, { method: "POST" });
}