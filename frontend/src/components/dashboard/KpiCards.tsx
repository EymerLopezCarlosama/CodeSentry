import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Dashboard } from "../../types";

interface KpiCardsProps {
  datos: Dashboard;
}

function sinAnimacion(): boolean {
  return (
    document.documentElement.getAttribute("data-efectos") === "bajo" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function useContador(objetivo: number): number {
  const [valor, setValor] = useState(() => (sinAnimacion() ? objetivo : 0));

  useEffect(() => {
    if (sinAnimacion() || objetivo === 0) {
      setValor(objetivo);
      return;
    }
    const inicio = performance.now();
    const duracion = 700;
    let cuadro = 0;
    const paso = (ahora: number) => {
      const t = Math.min((ahora - inicio) / duracion, 1);
      setValor(Math.round(objetivo * (1 - Math.pow(1 - t, 3))));
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    setValor(0);
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo]);

  return valor;
}

function Numero({ valor }: { valor: number }) {
  return <>{useContador(valor)}</>;
}

function Icono({ children }: { children: ReactNode }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

const ICONOS = {
  proyectos: (
    <Icono>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Icono>
  ),
  analisis: (
    <Icono>
      <path d="M3 12h4l3-8 4 16 3-8h4" />
    </Icono>
  ),
  hallazgos: (
    <Icono>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Icono>
  ),
  aceptadas: (
    <Icono>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Icono>
  ),
  rechazadas: (
    <Icono>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </Icono>
  ),
};

export default function KpiCards({ datos }: KpiCardsProps) {
  const tarjetas = [
    { etiqueta: "Proyectos", valor: datos.totales.proyectos, color: "azul", icono: ICONOS.proyectos },
    { etiqueta: "Análisis", valor: datos.totales.analisis, color: "cian", icono: ICONOS.analisis },
    { etiqueta: "Hallazgos", valor: datos.totales.hallazgos, color: "naranja", icono: ICONOS.hallazgos },
    { etiqueta: "Aceptadas", valor: datos.checklist.aceptada, color: "verde", icono: ICONOS.aceptadas },
    { etiqueta: "Rechazadas", valor: datos.checklist.rechazada, color: "rojo", icono: ICONOS.rechazadas },
  ];

  return (
    <div className="kpi-grid">
      {tarjetas.map((t) => (
        <div key={t.etiqueta} className={`kpi kpi-${t.color}`}>
          <div className="kpi-cabecera">
            <span className="kpi-etiqueta">{t.etiqueta}</span>
            <span className="kpi-icono">{t.icono}</span>
          </div>
          <div className="kpi-valor">
            <Numero valor={t.valor} />
          </div>
        </div>
      ))}
    </div>
  );
}