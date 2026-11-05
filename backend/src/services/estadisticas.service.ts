import * as estadisticasRepository from "../repositories/estadisticas.repository";
import type { FilaEstadisticaRegla } from "../repositories/estadisticas.repository";
import type { EstadisticaRegla } from "../types";

// Con menos hallazgos marcados que esto no se saca ninguna conclusión
export const MUESTRA_MINIMA = 10;

function porcentaje(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 100) : null;
}

// Solo SUGIERE: el sistema nunca desactiva ni cambia una regla por su cuenta.
export function calcular(fila: FilaEstadisticaRegla): EstadisticaRegla {
  const marcadas = fila.aceptadas + fila.rechazadas;
  const suficiente = marcadas >= MUESTRA_MINIMA;
  // Solo el rechazo por falso_positivo baja la precisión (no_aplica y riesgo_aceptado no)
  const precision = porcentaje(marcadas - fila.falsos_positivos, marcadas);

  let sugerencia: string | null = null;
  if (suficiente && precision !== null && precision < 50) {
    sugerencia =
      "Más de la mitad de los hallazgos marcados son falsos positivos confirmados: revisar el patrón de la regla.";
  }

  return {
    ...fila,
    muestra_suficiente: suficiente,
    tasa_aceptacion: porcentaje(fila.aceptadas, marcadas),
    precision_estimada: precision,
    sugerencia,
  };
}

export async function obtener(): Promise<EstadisticaRegla[]> {
  return (await estadisticasRepository.contarPorRegla()).map(calcular);
}