import { AppError } from "../middlewares/error-handler";
import * as checklistRepository from "../repositories/checklist.repository";
import type { ItemChecklistFila } from "../repositories/checklist.repository";
import { EstadoChecklist, MotivoRechazo} from "../types";

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
  estado: EstadoChecklist,
  motivo?: MotivoRechazo
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
  // El motivo solo se conserva al rechazar; al aceptar o volver a pendiente se borra
  const motivoFinal = estado === "rechazada" ? motivo ?? null : null;
  await checklistRepository.actualizarEstado(idItem, idEstado, fecha, motivoFinal);

  const actualizado = await checklistRepository.obtenerPorId(idItem);
  if (!actualizado) {
    throw new AppError(404, "CHECKLIST_NO_ENCONTRADO", "El elemento del checklist no existe.");
  }
  return actualizado;
}