import { AppError } from "../middlewares/error-handler";
import * as proyectosRepository from "../repositories/proyectos.repository";
import { ProyectoRespuesta } from "../types";
import { ActualizarProyectoDatos, CrearProyectoDatos } from "../validators/proyectos.validator";

function pendiente(funcion: string): never {
  throw new Error(`proyectos.service.${funcion}: pendiente de implementar`);
}

// HU02 (Jhon)
export async function listar(): Promise<ProyectoRespuesta[]> {
  return pendiente("listar");
}

// HU02 (Jhon): inexistente → AppError(404, "PROYECTO_NO_ENCONTRADO", ...)
export async function obtener(id: number): Promise<ProyectoRespuesta> {
  return pendiente("obtener");
}

// HU01 (Jhon): normalizar ruta → 400 RUTA_INEXISTENTE → 409 RUTA_DUPLICADA
// → modelo por defecto → estado "activo" → insertar → devolver con obtener
export async function crear(datos: CrearProyectoDatos): Promise<ProyectoRespuesta> {
  return pendiente("crear");
}

// HU03 (Pao): reutiliza la validación de ruta de crear, ignora el propio proyecto
// al buscar duplicados, 404 si no existe
export async function actualizar(
  id: number,
  datos: ActualizarProyectoDatos
): Promise<ProyectoRespuesta> {
  return pendiente("actualizar");
}

// HU04 (Pao): 0 filas → 404. Solo BD, nunca fs.
export async function eliminar(id: number): Promise<void> {
  const filasBorradas = await proyectosRepository.eliminar(id);
  if (filasBorradas === 0) {
    throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto no existe.");
  }
}