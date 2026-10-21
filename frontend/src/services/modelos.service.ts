import { api } from "./api";
import type { InstalacionModelo, ModelosDisponibles } from "../types";

export function listar(): Promise<ModelosDisponibles> {
  return api<ModelosDisponibles>("/modelos");
}

// 202 = empieza la descarga, 200 = ya estaba instalado (mismo cuerpo)
export function instalar(modelo: string): Promise<InstalacionModelo> {
  return api<InstalacionModelo>("/modelos/instalar", { method: "POST", body: { modelo } });
}

export function progreso(modelo: string): Promise<InstalacionModelo> {
  return api<InstalacionModelo>(`/modelos/instalar?modelo=${encodeURIComponent(modelo)}`);
}

// Mismo criterio del analyzer: "x" o "x:latest" cuentan como instalado
export function estaInstalado(modelo: string, instalados: string[]): boolean {
  return instalados.includes(modelo) || instalados.includes(`${modelo}:latest`);
}

// 0-100; con total 0 aún no hay dato
export function porcentaje(p: InstalacionModelo["progreso"]): number {
  return p.total > 0 ? Math.min(100, Math.round((p.completado / p.total) * 100)) : 0;
}