import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Severidad } from "../../types";
import { etiquetaSeveridad } from "../../utils/format";

interface GraficoSeveridadProps {
  por_severidad: Record<Severidad, number>;
}

const ORDEN: Severidad[] = ["baja", "media", "alta", "critica"];
const TEXTO_EJE = { fill: "var(--color-texto-suave)", fontSize: 12 };

export default function GraficoSeveridad({ por_severidad }: GraficoSeveridadProps) {
  const datos = ORDEN.map((sev) => ({
    severidad: sev,
    nombre: etiquetaSeveridad(sev),
    total: por_severidad[sev],
  }));

  return (
    <div className="tarjeta">
      <h3>Hallazgos por severidad</h3>
      <div className="grafico-contenedor">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 22, right: 8, left: -18, bottom: 0 }}>
            <defs>
              {ORDEN.map((sev) => (
                <linearGradient key={sev} id={`grad-${sev}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" style={{ stopColor: `var(--sev-${sev})`, stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: `var(--sev-${sev})`, stopOpacity: 0.45 }} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--color-borde)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="nombre" tick={TEXTO_EJE} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={TEXTO_EJE} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "var(--color-primario-suave)" }}
              contentStyle={{
                background: "var(--color-superficie)",
                border: "1px solid var(--color-borde)",
                borderRadius: 10,
                color: "var(--color-texto)",
              }}
              labelStyle={{ color: "var(--color-texto)", fontWeight: 600 }}
              itemStyle={{ color: "var(--color-texto-suave)" }}
            />
            <Bar dataKey="total" name="Hallazgos" radius={[8, 8, 0, 0]} maxBarSize={56}>
              {datos.map((d) => (
                <Cell key={d.severidad} fill={`url(#grad-${d.severidad})`} />
              ))}
              <LabelList
                dataKey="total"
                position="top"
                style={{ fill: "var(--color-texto)", fontSize: 12, fontWeight: 700 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}