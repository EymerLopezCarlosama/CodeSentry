import { api } from "./api";
import type {
  Archivo,
  DatosActualizarProyecto,
  DatosNuevoProyecto,
  Proyecto,
  ResultadoEscaneo,
} from "../types";

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

// HU05 (Jhon): archivos soportados del proyecto, para elegir uno al pedir una revisión
export function listarArchivos(id: number): Promise<Archivo[]> {
  return api<Archivo[]>(`/proyectos/${id}/archivos`);
}

// Escáner de lenguajes: cuenta archivos por lenguaje antes de registrar el proyecto (no guarda nada)
export function escanear(rutaCarpeta: string): Promise<ResultadoEscaneo> {
  return api<ResultadoEscaneo>("/proyectos/escanear", {
    method: "POST",
    body: { ruta_carpeta: rutaCarpeta },
  });
}