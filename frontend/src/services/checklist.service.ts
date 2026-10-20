import { api } from "./api";
import type { EstadoChecklist, ItemChecklist } from "../types";

export function listar(idAnalisis: number): Promise<ItemChecklist[]> {
  return api<ItemChecklist[]>(`/analisis/${idAnalisis}/checklist`);
}

export function marcar(idItem: number, estado: EstadoChecklist): Promise<ItemChecklist> {
  return api<ItemChecklist>(`/checklist/${idItem}`, { method: "PATCH", body: { estado } });
}