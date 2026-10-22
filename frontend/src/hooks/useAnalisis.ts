// PROMPT — hooks/useAnalisis.ts
//
// Hook para lanzar y seguir un análisis: iniciar(idProyecto, objetivo, idArchivo?) crea la revisión y luego consulta GET /analisis/:id cada 2 s hasta que el estado sea "completado" o "fallido".
// Expone { estado, progreso, error, iniciar }. Debe limpiar el intervalo al desmontar el componente.
//
// Depende de: services/revisiones.service.ts
// Referencia: docs/api-contract.md (sección "Análisis") · HU-06
// Hecho cuando: la barra de progreso se mueve sola mientras la IA analiza.

import { useCallback, useEffect, useRef, useState } from "react";
import * as revisionesService from "../services/revisiones.service";
import type { EstadoAnalisis, Progreso, TipoObjetivo } from "../types";

const INTERVALO_MS = 2000;

export function useAnalisis() {
  const [idAnalisis, setIdAnalisis] = useState<number | null>(null);
  const [estado, setEstado] = useState<EstadoAnalisis | null>(null);
  const [progreso, setProgreso] = useState<Progreso>({ procesados: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);

  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);
  const consultando = useRef(false); // evita pedir dos veces si el servidor tarda
  const creando = useRef(false); // evita crear dos revisiones con un doble clic

  const detener = useCallback((): void => {
    if (temporizador.current !== null) {
      clearInterval(temporizador.current);
      temporizador.current = null;
    }
  }, []);

  // Al cerrar la pantalla se apaga el intervalo
  useEffect(() => detener, [detener]);

  const consultar = useCallback(
    async (id: number): Promise<void> => {
      if (consultando.current) return;
      consultando.current = true;
      try {
        const analisis = await revisionesService.obtenerAnalisis(id);
        setEstado(analisis.estado);
        setProgreso(analisis.progreso);
        if (analisis.estado === "completado" || analisis.estado === "fallido") {
          detener();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
        detener();
      } finally {
        consultando.current = false;
      }
    },
    [detener]
  );

  const iniciar = useCallback(
    async (idProyecto: number, objetivo: TipoObjetivo, idArchivo?: number): Promise<void> => {
      if (creando.current) return;
      creando.current = true;
      detener();
      setError(null);
      setEstado(null);
      setIdAnalisis(null);
      setProgreso({ procesados: 0, total: 0 });

      try {
        const revision = await revisionesService.crear({
          id_proyecto: idProyecto,
          tipo_objetivo: objetivo,
          ...(objetivo === "archivo" && idArchivo !== undefined ? { id_archivo: idArchivo } : {}),
        });
        setIdAnalisis(revision.id_analisis);
        setEstado(revision.estado);
        temporizador.current = setInterval(() => {
          void consultar(revision.id_analisis);
        }, INTERVALO_MS);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        creando.current = false;
      }
    },
    [consultar, detener]
  );

  return { idAnalisis, estado, progreso, error, iniciar };
}