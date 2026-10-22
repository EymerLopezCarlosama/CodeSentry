// PROMPT — revisiones.service.ts — Lógica de negocio de revisiones (HU-05)
//
// crear: proyecto inexistente → 404; si tipo_objetivo="archivo", el archivo debe pertenecer al proyecto (si no, 400).
// Re-escanear con scanner.service, crear SolicitudRevision y Analisis (estado "pendiente", modelo_ia_usado = Proyecto.modelo_ia) en UNA transacción.
// Luego disparar analisis.service.ejecutar(id_analisis) SIN await (segundo plano) y responder de inmediato.
//
// Aquí viven las reglas. Errores: lanzar AppError(status, codigo, mensaje) con los códigos del contrato (error-handler.ts los convierte al JSON estándar).
//
// Depende de: repositories del mismo dominio, middlewares/error-handler.ts (AppError)
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis

import { pool } from "../config/database";
import { AppError } from "../middlewares/error-handler";
import * as proyectosRepository from "../repositories/proyectos.repository";
import * as revisionesRepository from "../repositories/revisiones.repository";
import type { CrearRevisionDatos } from "../validators/revisiones.validator";
import * as analisisService from "./analisis.service";
import * as scannerService from "./scanner.service";

export interface RevisionCreada {
  id_solicitud: number;
  id_analisis: number;
  estado: "pendiente";
}

export async function crear(datos: CrearRevisionDatos): Promise<RevisionCreada> {
  const proyecto = await proyectosRepository.obtenerPorId(datos.id_proyecto);
  if (!proyecto) {
    throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto no existe.");
  }

  // Un archivo de otro proyecto (o inexistente) no es válido.
  if (datos.tipo_objetivo === "archivo") {
    const archivo = await proyectosRepository.obtenerArchivoPorId(datos.id_archivo ?? 0);
    if (!archivo || archivo.id_proyecto !== proyecto.id_proyecto) {
      throw new AppError(400, "ARCHIVO_INVALIDO", "El archivo no pertenece al proyecto.");
    }
  }

  // Re-escanear: las filas existentes de Archivo conservan su id (UPSERT).
  const archivos = await scannerService.escanear(proyecto.id_proyecto, proyecto.ruta_carpeta);
  if (archivos.length === 0) {
    throw new AppError(
      400,
      "SIN_ARCHIVOS_SOPORTADOS",
      "La carpeta no tiene archivos .js, .ts ni .py para revisar."
    );
  }
  if (
    datos.tipo_objetivo === "archivo" &&
    !archivos.some((a) => a.id_archivo === datos.id_archivo)
  ) {
    throw new AppError(400, "ARCHIVO_INVALIDO", "El archivo ya no existe en la carpeta.");
  }

  const idEstado = await proyectosRepository.obtenerIdEstado("pendiente", "analisis");
  if (idEstado === null) {
    throw new AppError(500, "ESTADO_NO_ENCONTRADO", "No existe el estado 'pendiente' de análisis en la base de datos.");
  }

  // SolicitudRevision + Analisis en UNA transacción
  const conexion = await pool.getConnection();
  let idSolicitud: number;
  let idAnalisis: number;
  try {
    await conexion.beginTransaction();
    idSolicitud = await revisionesRepository.insertarSolicitud(conexion, {
      id_proyecto: proyecto.id_proyecto,
      tipo_objetivo: datos.tipo_objetivo,
      id_archivo: datos.tipo_objetivo === "archivo" ? datos.id_archivo ?? null : null,
    });
    idAnalisis = await revisionesRepository.insertarAnalisis(conexion, {
      id_solicitud: idSolicitud,
      modelo_ia_usado: proyecto.modelo_ia,
      id_estado: idEstado,
    });
    await conexion.commit();
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }

  // Segundo plano: sin await. ejecutar() nunca rechaza (maneja sus propios errores).
  void analisisService.ejecutar(idAnalisis);

  return { id_solicitud: idSolicitud, id_analisis: idAnalisis, estado: "pendiente" };
}