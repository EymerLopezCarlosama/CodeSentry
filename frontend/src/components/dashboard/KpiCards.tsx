// PROMPT — components/dashboard/KpiCards.tsx
//
// Tarjetas con totales: proyectos, análisis, hallazgos, aceptadas y rechazadas. Props: datos del dashboard.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-10

import type { Dashboard } from "../../types";

interface KpiCardsProps {
  datos: Dashboard;
}

export default function KpiCards({ datos }: KpiCardsProps) {
  const tarjetas = [
    { etiqueta: "Proyectos", valor: datos.totales.proyectos },
    { etiqueta: "Análisis", valor: datos.totales.analisis },
    { etiqueta: "Hallazgos", valor: datos.totales.hallazgos },
    { etiqueta: "Aceptadas", valor: datos.checklist.aceptada },
    { etiqueta: "Rechazadas", valor: datos.checklist.rechazada },
  ];

  return (
    <div className="kpi-grid">
      {tarjetas.map((t) => (
        <div key={t.etiqueta} className="kpi">
          <div className="kpi-valor">{t.valor}</div>
          <div className="kpi-etiqueta">{t.etiqueta}</div>
        </div>
      ))}
    </div>
  );
}