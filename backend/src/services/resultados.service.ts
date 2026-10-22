// PROMPT — resultados.service.ts — Lógica de negocio de resultados (HU-07)
//
// Análisis inexistente → 404. Si el análisis NO está "completado": devolver { estado real, archivos: [] } (NO es un error).
// Agrupar hallazgos por archivo y ordenarlos por severidad (critica → alta → media → baja). Cada hallazgo lleva estado_checklist.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem

import * as resultadosRepository from "../repositories/resultados.repository";
import type { Hallazgo, ResultadosAgrupados, Severidad } from "../types";
import * as analisisService from "./analisis.service";

export async function listar(
  idAnalisis: number,
  severidad?: Severidad
): Promise<ResultadosAgrupados> {
  // Lanza 404 ANALISIS_NO_ENCONTRADO si el análisis no existe
  const analisis = await analisisService.obtener(idAnalisis);

  // Si no terminó, se devuelve su estado real y ninguna lista (no es un error)
  if (analisis.estado !== "completado") {
    return { estado: analisis.estado, archivos: [] };
  }

  // El repositorio ya los entrega ordenados por archivo y por severidad
  const filas = await resultadosRepository.listarPorAnalisis(idAnalisis, severidad);

  // Map conserva el orden en que se insertan las claves
  const porArchivo = new Map<string, Hallazgo[]>();
  for (const fila of filas) {
    const hallazgos = porArchivo.get(fila.ruta_relativa) ?? [];
    hallazgos.push({
      id_resultado: fila.id_resultado,
      tipo: fila.tipo,
      severidad: fila.severidad,
      linea_codigo: fila.linea_codigo,
      descripcion: fila.descripcion,
      estado_checklist: fila.estado_checklist,
    });
    porArchivo.set(fila.ruta_relativa, hallazgos);
  }

  return {
    estado: "completado",
    archivos: [...porArchivo].map(([ruta_relativa, hallazgos]) => ({ ruta_relativa, hallazgos })),
  };
}