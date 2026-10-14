// PROMPT — components/dashboard/GraficoSeveridad.tsx
//
// Gráfico de barras (recharts) de hallazgos por severidad, con los colores de severidad. Props: por_severidad.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-10

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Severidad } from "../../types";
import { etiquetaSeveridad } from "../../utils/format";

interface GraficoSeveridadProps {
  por_severidad: Record<Severidad, number>;
}

const ORDEN: Severidad[] = ["baja", "media", "alta", "critica"];

// Mismos colores que --sev-* de index.css (SVG necesita el valor directo)
const COLORES: Record<Severidad, string> = {
  baja: "#16a34a",
  media: "#eab308",
  alta: "#f97316",
  critica: "#dc2626",
};

export default function GraficoSeveridad({ por_severidad }: GraficoSeveridadProps) {
  const datos = ORDEN.map((sev) => ({
    nombre: etiquetaSeveridad(sev),
    total: por_severidad[sev],
    color: COLORES[sev],
  }));

  return (
    <div className="tarjeta">
      <h3>Hallazgos por severidad</h3>
      <div className="grafico-contenedor">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" name="Hallazgos">
              {datos.map((d) => (
                <Cell key={d.nombre} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}