import { AppError } from "../middlewares/error-handler";
import * as repo from "../repositories/analisis.repository";
import { AnalisisRespuesta, Progreso } from "../types";
import { logger } from "../utils/logger";
import * as analyzerClient from "./analyzer-client.service";

const INTERVALO_MS = 2000;
const MAX_FALLOS_CONSULTA = 3;

// El progreso no va a la BD (contrato): vive en memoria mientras corre el análisis.
const progresos = new Map<number, Progreso>();
const enEjecucion = new Set<number>();

const dormir = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function marcarFallido(idAnalisis: number): Promise<void> {
  try {
    await repo.cambiarEstado(idAnalisis, "fallido");
  } catch (err) {
    logger.error(`analisis ${idAnalisis}: no se pudo marcar como fallido`, err);
  }
}

/** Se lanza SIN await desde revisiones.service. Nunca rechaza. */
export async function ejecutar(idAnalisis: number): Promise<void> {
  if (enEjecucion.has(idAnalisis)) return;
  enEjecucion.add(idAnalisis);
  try {
    const ctx = await repo.obtenerContexto(idAnalisis);
    if (!ctx) {
      logger.error(`analisis ${idAnalisis}: no existe (o su solicitud/proyecto)`);
      return;
    }

    await repo.cambiarEstado(idAnalisis, "en_proceso");
    progresos.set(idAnalisis, { procesados: 0, total: 0 });

    const { job_id } = await analyzerClient.crearTrabajo({
      ruta_base: ctx.ruta_base,
      objetivo: ctx.tipo_objetivo,
      ruta_relativa: ctx.ruta_relativa,
      modelo: ctx.modelo,
      lenguajes: ctx.lenguajes,
    });

    let fallos = 0;
    for (;;) {
      await dormir(INTERVALO_MS);

      let salida;
      try {
        salida = await analyzerClient.consultarTrabajo(job_id);
        fallos = 0;
      } catch (err) {
        fallos++;
        logger.warn(`analisis ${idAnalisis}: fallo al consultar el analyzer (${fallos}/${MAX_FALLOS_CONSULTA})`);
        if (fallos >= MAX_FALLOS_CONSULTA) throw err;
        continue;
      }

      progresos.set(idAnalisis, salida.progreso);
      if (salida.estado === "en_proceso") continue;

      if (salida.estado === "fallido") {
        logger.warn(`analisis ${idAnalisis}: el analyzer lo marcó fallido`, salida.errores);
        await repo.cambiarEstado(idAnalisis, "fallido");
        return;
      }

      // completado: Resultado + ChecklistItem "pendiente" en UNA transacción
      const resumen = await repo.insertarResultadosConChecklist(idAnalisis, salida.resultados);
      if (resumen.omitidos.length > 0) {
        logger.warn(`analisis ${idAnalisis}: hallazgos de archivos no registrados`, resumen.omitidos);
      }
      if (salida.errores.length > 0) {
        logger.warn(`analisis ${idAnalisis}: archivos con error`, salida.errores);
      }
      await repo.cambiarEstado(idAnalisis, "completado");
      return;
    }
  } catch (err) {
    logger.error(`analisis ${idAnalisis}: falló la ejecución`, err);
    await marcarFallido(idAnalisis);
  } finally {
    enEjecucion.delete(idAnalisis);
  }
}

export async function obtener(id: number): Promise<AnalisisRespuesta> {
  const analisis = await repo.obtenerPorId(id);
  if (!analisis) throw new AppError(404, "ANALISIS_NO_ENCONTRADO", "El análisis no existe.");
  return { ...analisis, progreso: progresos.get(id) ?? { procesados: 0, total: 0 } };
}