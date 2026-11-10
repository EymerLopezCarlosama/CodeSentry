import { api } from "./api";
import type { DocumentacionGenerada, PruebasGeneradas } from "../types";

export function generarPruebas(idArchivo: number) {
  return api<PruebasGeneradas>(`/archivos/${idArchivo}/pruebas`, { method: "POST" });
}

export function generarDocumentacion(idArchivo: number) {
  return api<DocumentacionGenerada>(`/archivos/${idArchivo}/documentacion`, { method: "POST" });
}
