import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
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
  pendiente: "var(--color-texto-suave)",
  aceptada: "var(--sev-baja)",
  rechazada: "var(--sev-critica)",
};

export default function GraficoChecklist({ checklist }: GraficoChecklistProps) {
  const [activo, setActivo] = useState<EstadoChecklist | null>(null);

  const datos = ORDEN.map((estado) => ({
    estado,
    nombre: ETIQUETAS[estado],
    total: checklist[estado],
    color: COLORES[estado],
  }));
  const total = datos.reduce((suma, d) => suma + d.total, 0);
  const seleccionado = datos.find((d) => d.estado === activo) ?? null;
  const porcentaje = seleccionado && total > 0 ? Math.round((seleccionado.total / total) * 100) : 0;

  return (
    <div className="tarjeta">
      <h3>Estado del checklist</h3>
      {total === 0 ? (
        <p className="texto-suave">Aún no hay sugerencias para mostrar.</p>
      ) : (
        <>
          <div className="donut-contenedor">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={datos}
                  dataKey="total"
                  nameKey="nombre"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={3}
                  cornerRadius={6}
                  stroke="none"
                  onMouseEnter={(_, indice) => setActivo(datos[indice]?.estado ?? null)}
                  onMouseLeave={() => setActivo(null)}
                >
                  {datos.map((d) => (
                    <Cell
                      key={d.estado}
                      fill={d.color}
                      fillOpacity={activo === null || activo === d.estado ? 1 : 0.3}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="donut-centro">
              {seleccionado ? (
                <>
                  <strong>{seleccionado.total}</strong>
                  <span>
                    {seleccionado.nombre} · {porcentaje} %
                  </span>
                </>
              ) : (
                <>
                  <strong>{total}</strong>
                  <span>sugerencias</span>
                </>
              )}
            </div>
          </div>

          <ul className="leyenda">
            {datos.map((d) => (
              <li
                key={d.estado}
                className={activo === d.estado ? "activa" : undefined}
                onMouseEnter={() => setActivo(d.estado)}
                onMouseLeave={() => setActivo(null)}
              >
                <span className="leyenda-punto" style={{ background: d.color }} />
                {d.nombre} ({d.total})
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}