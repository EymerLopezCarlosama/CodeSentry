// Barra de progreso: procesados / total, con el estado (en proceso, completado, fallido).
// Mientras no se conoce el total (se está preparando el trabajo) no se simula un porcentaje.
// Componente de presentación (sin llamadas a la API).
// Referencia: HU-06

import type { EstadoAnalisis, Progreso } from "../../types";

interface ProgresoAnalisisProps {
  estado: EstadoAnalisis | null;
  progreso: Progreso;
}

const ETIQUETAS: Record<EstadoAnalisis, string> = {
  pendiente: "Pendiente",
  en_proceso: "Analizando...",
  completado: "Completado",
  fallido: "Falló el análisis",
};

export default function ProgresoAnalisis({ estado, progreso }: ProgresoAnalisisProps) {
  if (estado === null) return null;

  const preparando = (estado === "pendiente" || estado === "en_proceso") && progreso.total === 0;

  const porcentaje =
    estado === "completado"
      ? 100
      : progreso.total > 0
        ? Math.min(100, Math.round((progreso.procesados / progreso.total) * 100))
        : 0;

  return (
    <div className={`tarjeta progreso progreso-${estado}`} role="status">
      <div className="progreso-cabecera">
        <strong>{preparando ? "Preparando el análisis..." : ETIQUETAS[estado]}</strong>
        <span className="progreso-conteo">
          {preparando ? "Detectando archivos..." : `${progreso.procesados} de ${progreso.total} pasos`}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={preparando ? undefined : porcentaje}
        aria-busy={preparando}
        className={`progreso-pista${preparando ? " indeterminado" : ""}`}
      >
        <div className="progreso-relleno" style={preparando ? undefined : { width: `${porcentaje}%` }} />
      </div>

      {!preparando && <span className="progreso-porcentaje">{porcentaje} %</span>}
    </div>
  );
}