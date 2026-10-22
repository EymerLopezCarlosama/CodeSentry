// PROMPT — components/resultados/SeveridadBadge.tsx
//
// Etiqueta con el color de la severidad (baja/media/alta/crítica). Props: severidad.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-07

import { etiquetaSeveridad } from "../../utils/format";
import type { Severidad } from "../../types";

interface SeveridadBadgeProps {
  severidad: Severidad;
}

export default function SeveridadBadge({ severidad }: SeveridadBadgeProps) {
  return <span className={`badge badge-${severidad}`}>{etiquetaSeveridad(severidad)}</span>;
}