import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { EstadoChecklist, Severidad, TipoHallazgo } from "../types";

export interface ItemChecklistFila {
  id_checklist: number;
  id_resultado: number;
  ruta_relativa: string;
  linea_codigo: number;
  tipo: TipoHallazgo;
  severidad: Severidad;
  descripcion: string;
  estado: EstadoChecklist;
  fecha_marcado: string | null;
}

interface FilaItem extends RowDataPacket, ItemChecklistFila {}

interface FilaEstado extends RowDataPacket {
  id_estado: number;
}

const SELECT_ITEM = `
  SELECT c.id_checklist, c.id_resultado, a.ruta_relativa, r.linea_codigo,
         r.tipo, r.severidad, r.descripcion,
         e.nombre_estado AS estado, c.fecha_marcado
  FROM ChecklistItem c
  JOIN Resultado r ON r.id_resultado = c.id_resultado
  JOIN Archivo a ON a.id_archivo = r.id_archivo
  JOIN Estado e ON e.id_estado = c.id_estado`;

// Items de un análisis, críticos primero
export async function listarPorAnalisis(idAnalisis: number): Promise<ItemChecklistFila[]> {
  const [filas] = await pool.query<FilaItem[]>(
    `${SELECT_ITEM}
     WHERE r.id_analisis = ?
     ORDER BY FIELD(r.severidad, 'critica', 'alta', 'media', 'baja'),
              a.ruta_relativa, r.linea_codigo`,
    [idAnalisis]
  );
  return filas;
}

export async function obtenerPorId(idChecklist: number): Promise<ItemChecklistFila | null> {
  const [filas] = await pool.query<FilaItem[]>(`${SELECT_ITEM} WHERE c.id_checklist = ?`, [
    idChecklist,
  ]);
  return filas[0] ?? null;
}

export async function obtenerIdEstado(nombre: string, contexto: string): Promise<number | null> {
  const [filas] = await pool.query<FilaEstado[]>(
    "SELECT id_estado FROM Estado WHERE nombre_estado = ? AND contexto_modulo = ?",
    [nombre, contexto]
  );
  return filas[0]?.id_estado ?? null;
}

// fechaMarcado: "YYYY-MM-DD" o null. Devuelve filas afectadas.
export async function actualizarEstado(
  idChecklist: number,
  idEstado: number,
  fechaMarcado: string | null
): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "UPDATE ChecklistItem SET id_estado = ?, fecha_marcado = ? WHERE id_checklist = ?",
    [idEstado, fechaMarcado, idChecklist]
  );
  return resultado.affectedRows;
}