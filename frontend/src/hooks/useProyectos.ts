import { useCallback, useEffect, useState } from "react";
import * as proyectosService from "../services/proyectos.service";
import type { DatosActualizarProyecto, DatosNuevoProyecto, Proyecto } from "../types";

export function useProyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recargar = useCallback(async (): Promise<void> => {
    setCargando(true);
    setError(null);
    try {
      setProyectos(await proyectosService.listar());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  async function crear(datos: DatosNuevoProyecto): Promise<Proyecto> {
    const proyecto = await proyectosService.crear(datos);
    await recargar();
    return proyecto;
  }

  async function actualizar(id: number, datos: DatosActualizarProyecto): Promise<Proyecto> {
    const proyecto = await proyectosService.actualizar(id, datos);
    await recargar();
    return proyecto;
  }

  async function eliminar(id: number): Promise<void> {
    await proyectosService.eliminar(id);
    await recargar();
  }

  return { proyectos, cargando, error, recargar, crear, actualizar, eliminar };
}