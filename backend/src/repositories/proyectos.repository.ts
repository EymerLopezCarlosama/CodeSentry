import { NombreLenguaje, Proyecto, ProyectoDetalle } from "../types";
import { ResultSetHeader } from "mysql2";
import { pool } from "../config/database";

export interface DatosNuevoProyecto {
  nombre: string;
  ruta_carpeta: string;
  modelo_ia: string;
  id_estado: number;
  lenguajes: NombreLenguaje[];
}

export interface DatosActualizarProyecto {
  nombre?: string;
  ruta_carpeta?: string;
  modelo_ia?: string;
  lenguajes?: NombreLenguaje[];
}

function pendiente(funcion: string): never {
  throw new Error(`proyectos.repository.${funcion}: pendiente de implementar`);
}

// HU02 (Jhon): JOIN con Estado y lenguajes por Proyecto_Lenguaje
export async function listar(): Promise<ProyectoDetalle[]> {
  return pendiente("listar");
}

export async function obtenerPorId(id: number): Promise<ProyectoDetalle | null> {
  return pendiente("obtenerPorId");
}

// HU01 (Jhon)
export async function obtenerPorRuta(ruta: string): Promise<Proyecto | null> {
  return pendiente("obtenerPorRuta");
}

export async function obtenerIdEstado(nombre: string, contexto: string): Promise<number | null> {
  return pendiente("obtenerIdEstado");
}

// Transacción: Proyecto + Proyecto_Lenguaje. Devuelve el id nuevo.
export async function insertar(datos: DatosNuevoProyecto): Promise<number> {
  return pendiente("insertar");
}

// HU03 (Pao): pone fecha_actualizacion = hoy. Devuelve filas afectadas.
export async function actualizar(id: number, datos: DatosActualizarProyecto): Promise<number> {
  return pendiente("actualizar");
}

// HU04 (Pao): devuelve cuántas filas borró (0 = no existía).
export async function eliminar(id: number): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "DELETE FROM Proyecto WHERE id_proyecto = ?",
    [id]
  );
  return resultado.affectedRows;
}