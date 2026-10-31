import { api } from "./api";
import type { FormatoReporte, Reporte, ReporteGenerado } from "../types";

export function generar(idAnalisis: number, formato: FormatoReporte): Promise<ReporteGenerado> {
  return api<ReporteGenerado>(`/analisis/${idAnalisis}/reportes`, {
    method: "POST",
    body: { formato },
  });
}

export function listar(idAnalisis: number): Promise<Reporte[]> {
  return api<Reporte[]>(`/analisis/${idAnalisis}/reportes`);
}

// URL para un <a href>; el navegador hace la descarga
export function urlDescarga(idReporte: number): string {
  return `${import.meta.env.VITE_API_URL}/reportes/${idReporte}/descargar`;
}