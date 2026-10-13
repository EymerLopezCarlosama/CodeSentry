import { api } from "./api";
import type { DatosActualizarProyecto, DatosNuevoProyecto, Proyecto } from "../types";

export function listar(): Promise<Proyecto[]> {
  return api<Proyecto[]>("/proyectos");
}

export function obtener(id: number): Promise<Proyecto> {
  return api<Proyecto>(`/proyectos/${id}`);
}

export function crear(datos: DatosNuevoProyecto): Promise<Proyecto> {
  return api<Proyecto>("/proyectos", { method: "POST", body: datos });
}

export function actualizar(id: number, datos: DatosActualizarProyecto): Promise<Proyecto> {
  return api<Proyecto>(`/proyectos/${id}`, { method: "PUT", body: datos });
}

export function eliminar(id: number): Promise<void> {
  return api<void>(`/proyectos/${id}`, { method: "DELETE" });
}