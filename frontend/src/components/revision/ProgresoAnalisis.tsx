// PROMPT — components/revision/ProgresoAnalisis.tsx
//
// Barra de progreso: procesados / total, con el estado (en proceso, completado, fallido). Props: estado, progreso.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
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

const COLORES: Record<EstadoAnalisis, string> = {
  pendiente: "var(--color-primario)",
  en_proceso: "var(--color-primario)",
  completado: "var(--sev-baja)",
  fallido: "var(--color-peligro)",
};

export default function ProgresoAnalisis({ estado, progreso }: ProgresoAnalisisProps) {
  if (estado === null) return null;

  const porcentaje =
    progreso.total > 0 ? Math.min(100, Math.round((progreso.procesados / progreso.total) * 100)) : 0;

  return (
    <div className="tarjeta" style={{ display: "grid", gap: "8px", maxWidth: "560px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{ETIQUETAS[estado]}</strong>
        <span>
          {progreso.procesados} de {progreso.total} archivos
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={porcentaje}
        style={{
          height: "12px",
          background: "var(--color-borde)",
          borderRadius: "999px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${porcentaje}%`,
            height: "100%",
            background: COLORES[estado],
            transition: "width 0.3s",
          }}
        />
      </div>

      <span style={{ color: "var(--color-texto-suave)" }}>{porcentaje} %</span>
    </div>
  );
}