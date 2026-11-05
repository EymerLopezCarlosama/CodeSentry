// PROMPT — resultados.service.ts — Lógica de negocio de resultados (HU-07)
//
// Análisis inexistente → 404. Si el análisis NO está "completado": devolver { estado real, archivos: [] } (NO es un error).
// Agrupar hallazgos por archivo y ordenarlos por severidad (critica → alta → media → baja). Cada hallazgo lleva estado_checklist.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem

import fs from "fs/promises";
import path from "path";
import { AppError } from "../middlewares/error-handler";
import * as resultadosRepository from "../repositories/resultados.repository";
import type { CodigoLenguaje, FragmentoCodigo, Hallazgo, ResultadosAgrupados, Severidad } from "../types";
import { estaDentroDe, normalizarRuta } from "../utils/paths";
import * as analisisService from "./analisis.service";

export async function listar(
  idAnalisis: number,
  severidad?: Severidad
): Promise<ResultadosAgrupados> {
  // Lanza 404 ANALISIS_NO_ENCONTRADO si el análisis no existe
  const analisis = await analisisService.obtener(idAnalisis);

  // Si no terminó, se devuelve su estado real y ninguna lista (no es un error)
  if (analisis.estado !== "completado") {
    return { estado: analisis.estado, archivos: [], explicaciones_ia: null };
  }

  // El repositorio ya los entrega ordenados por archivo y por severidad
  const filas = await resultadosRepository.listarPorAnalisis(idAnalisis, severidad);

  // Map conserva el orden en que se insertan las claves
  const porArchivo = new Map<string, { id_archivo: number; hallazgos: Hallazgo[] }>();
  for (const fila of filas) {
    const grupo = porArchivo.get(fila.ruta_relativa) ?? { id_archivo: fila.id_archivo, hallazgos: [] };
    grupo.hallazgos.push({
      id_resultado: fila.id_resultado,
      regla: fila.regla ?? null,
      tipo: fila.tipo,
      severidad: fila.severidad,
      linea_codigo: fila.linea_codigo,
      descripcion: fila.descripcion,
      estado_checklist: fila.estado_checklist,
    });
    porArchivo.set(fila.ruta_relativa, grupo);
  }

  return {
    estado: "completado",
    explicaciones_ia: analisis.explicaciones_ia ?? null,
    archivos: [...porArchivo].map(([ruta_relativa, grupo]) => ({
      id_archivo: grupo.id_archivo,
      ruta_relativa,
      hallazgos: grupo.hallazgos,
    })),
  };}

const MAX_BYTES_ARCHIVO = 2 * 1024 * 1024; // 2 MB
const MAX_CARACTERES_LINEA = 500; // evita enviar una línea de JS minificado de 300 KB
const CONTEXTO_POR_DEFECTO = 6;

// Devuelve las líneas alrededor de la del hallazgo. Solo lectura: nunca escribe ni ejecuta nada.
export async function obtenerCodigo(
  idResultado: number,
  contexto: number = CONTEXTO_POR_DEFECTO
): Promise<FragmentoCodigo> {
  const datos = await resultadosRepository.obtenerContextoCodigo(idResultado);
  if (!datos) {
    throw new AppError(404, "RESULTADO_NO_ENCONTRADO", "El hallazgo no existe.");
  }

  const base = normalizarRuta(datos.ruta_carpeta);
  const completa = path.resolve(base, datos.ruta_relativa);
  if (!estaDentroDe(base, completa)) {
    throw new AppError(400, "RUTA_INVALIDA", "La ruta del archivo sale de la carpeta del proyecto.");
  }

  let texto: string;
  try {
    // realpath resuelve enlaces simbólicos: un enlace dentro del proyecto no puede apuntar fuera
    const [baseReal, real] = await Promise.all([fs.realpath(base), fs.realpath(completa)]);
    if (!estaDentroDe(baseReal, real)) {
      throw new AppError(400, "RUTA_INVALIDA", "La ruta del archivo sale de la carpeta del proyecto.");
    }
    const info = await fs.stat(real);
    if (!info.isFile()) throw new Error("no es un archivo");
    if (info.size > MAX_BYTES_ARCHIVO) {
      throw new AppError(413, "ARCHIVO_DEMASIADO_GRANDE", "El archivo es demasiado grande para mostrarlo.");
    }
    texto = (await fs.readFile(real, "utf-8")).replace(/^\uFEFF/, "");
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      404,
      "ARCHIVO_NO_ENCONTRADO",
      "El archivo ya no está en la carpeta del proyecto (¿se movió o se borró?)."
    );
  }

  const todas = texto.split(/\r?\n/);
  if (todas.length > 0 && todas[todas.length - 1] === "") todas.pop(); // el salto final no es una línea

  const total = todas.length;
  const linea = datos.linea_codigo;
  const fuera = linea > total; // el archivo cambió después del análisis
  const centro = Math.min(linea, total);
  const desde = Math.max(1, centro - contexto);
  const hasta = Math.min(total, centro + contexto);

  return {
    ruta_relativa: datos.ruta_relativa,
    lenguaje: datos.lenguaje as CodigoLenguaje,
    linea,
    desde,
    hasta,
    total_lineas: total,
    linea_fuera_de_rango: fuera,
    lineas: todas.slice(desde - 1, hasta).map((t, i) => ({
      numero: desde + i,
      texto: t.length > MAX_CARACTERES_LINEA ? `${t.slice(0, MAX_CARACTERES_LINEA)}…` : t,
    })),
  };
}