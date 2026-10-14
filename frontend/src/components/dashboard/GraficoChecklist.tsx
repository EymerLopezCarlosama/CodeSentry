// PROMPT — components/dashboard/GraficoChecklist.tsx
//
// Gráfico (recharts) de sugerencias pendientes / aceptadas / rechazadas. Props: checklist.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-10

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { EstadoChecklist } from "../../types";

interface GraficoChecklistProps {
  checklist: Record<EstadoChecklist, number>;
}

const ORDEN: EstadoChecklist[] = ["pendiente", "aceptada", "rechazada"];

const ETIQUETAS: Record<EstadoChecklist, string> = {
  pendiente: "Pendientes",
  aceptada: "Aceptadas",
  rechazada: "Rechazadas",
};

const COLORES: Record<EstadoChecklist, string> = {
  pendiente: "#6b7785",
  aceptada: "#16a34a",
  rechazada: "#dc2626",
};

export default function GraficoChecklist({ checklist }: GraficoChecklistProps) {
  const datos = ORDEN.map((estado) => ({
    nombre: ETIQUETAS[estado],
    total: checklist[estado],
    color: COLORES[estado],
  }));
  const total = datos.reduce((suma, d) => suma + d.total, 0);

  return (
    <div className="tarjeta">
      <h3>Estado del checklist</h3>
      {total === 0 ? (
        <p className="texto-suave">Aún no hay sugerencias para mostrar.</p>
      ) : (
        <div className="grafico-contenedor">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={datos} dataKey="total" nameKey="nombre" innerRadius={50} outerRadius={85}>
                {datos.map((d) => (
                  <Cell key={d.nombre} fill={d.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}