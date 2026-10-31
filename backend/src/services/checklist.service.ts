import { AppError } from "../middlewares/error-handler";
import * as checklistRepository from "../repositories/checklist.repository";
import type { ItemChecklistFila } from "../repositories/checklist.repository";
import { EstadoChecklist } from "../types";

// Fecha local de hoy en formato YYYY-MM-DD
function hoy(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export async function listar(idAnalisis: number): Promise<ItemChecklistFila[]> {
  return checklistRepository.listarPorAnalisis(idAnalisis);
}

export async function marcar(
  idItem: number,
  estado: EstadoChecklist
): Promise<ItemChecklistFila> {
  const item = await checklistRepository.obtenerPorId(idItem);
  if (!item) {
    throw new AppError(404, "CHECKLIST_NO_ENCONTRADO", "El elemento del checklist no existe.");
  }

  const idEstado = await checklistRepository.obtenerIdEstado(estado, "checklist");
  if (idEstado === null) {
    throw new AppError(500, "ESTADO_NO_ENCONTRADO", `No existe el estado '${estado}' en la base de datos.`);
  }

  const fecha = estado === "pendiente" ? null : hoy();
  await checklistRepository.actualizarEstado(idItem, idEstado, fecha);

  const actualizado = await checklistRepository.obtenerPorId(idItem);
  if (!actualizado) {
    throw new AppError(404, "CHECKLIST_NO_ENCONTRADO", "El elemento del checklist no existe.");
  }
  return actualizado;
}