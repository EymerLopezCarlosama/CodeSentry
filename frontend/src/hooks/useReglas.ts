import { useEffect, useState } from "react";
import * as reglasService from "../services/reglas.service";
import type { ReglaCatalogo } from "../types";

export function useReglas(): Map<string, ReglaCatalogo> {
  const [mapa, setMapa] = useState<Map<string, ReglaCatalogo>>(new Map());
  useEffect(() => {
    let activo = true;
    void reglasService.listar().then((lista) => {
      if (activo) setMapa(new Map(lista.map((r) => [r.id, r])));
    });
    return () => {
      activo = false;
    };
  }, []);
  return mapa;
}