import { api } from "./api";
import type { EstadoChecklist, ItemChecklist, MotivoRechazo } from "../types";

export function listar(idAnalisis: number): Promise<ItemChecklist[]> {
  return api<ItemChecklist[]>(`/analisis/${idAnalisis}/checklist`);
}

// El motivo solo se envía al rechazar
export function marcar(idItem: number, estado: EstadoChecklist, motivo?: MotivoRechazo): Promise<ItemChecklist> {
  return api<ItemChecklist>(`/checklist/${idItem}`, {
    method: "PATCH",
    body: motivo ? { estado, motivo } : { estado },
  });
}