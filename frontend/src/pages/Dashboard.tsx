// PROMPT — pages/Dashboard.tsx
//
// Pantalla del dashboard: carga GET /dashboard y muestra KpiCards, GraficoSeveridad, GraficoChecklist y el detalle por proyecto. Si no hay proyectos, EmptyState.
// La pantalla une hooks/services con componentes; la lógica de datos va en hooks y el HTML repetible en components.
//
// Depende de: services/dashboard.service.ts + components/dashboard/*
// Referencia: HU-10

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnalisisTable from "../components/analisis/AnalisisTable";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import GraficoChecklist from "../components/dashboard/GraficoChecklist";
import GraficoSeveridad from "../components/dashboard/GraficoSeveridad";
import KpiCards from "../components/dashboard/KpiCards";
import * as dashboardService from "../services/dashboard.service";
import * as revisionesService from "../services/revisiones.service";
import type { AnalisisResumen, Dashboard as DatosDashboard } from "../types";

export default function Dashboard() {
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recientes, setRecientes] = useState<AnalisisResumen[]>([]);
  const navigate = useNavigate();

  // Últimos análisis: si falla no se bloquea el dashboard
  useEffect(() => {
    let activo = true;
    revisionesService
      .listarAnalisis({ limite: 5 })
      .then((a) => {
        if (activo) setRecientes(a);
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    dashboardService
      .obtener()
      .then((d) => {
        if (activo) setDatos(d);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : "Error desconocido.");
      });
    return () => {
      activo = false;
    };
  }, []);

  if (error) {
    return (
      <>
        <h1>Dashboard</h1>
        <div className="tarjeta">
          <p className="mensaje-error">{error}</p>
        </div>
      </>
    );
  }

  if (!datos) {
    return (
      <>
        <h1>Dashboard</h1>
        <Loader />
      </>
    );
  }

  if (datos.totales.proyectos === 0) {
    return (
      <>
        <h1>Dashboard</h1>
        <EmptyState />
      </>
    );
  }

  return (
    <>
      <h1>Dashboard</h1>
      <KpiCards datos={datos} />
      <div className="graficos-grid">
        <GraficoSeveridad por_severidad={datos.por_severidad} />
        <GraficoChecklist checklist={datos.checklist} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Análisis recientes</h2>
        <Button variante="secundario" onClick={() => navigate("/analisis")}>
          Ver todos
        </Button>
      </div>
      {recientes.length === 0 ? (
        <div className="tarjeta">
          <p style={{ margin: 0 }}>Aún no se ha ejecutado ningún análisis.</p>
        </div>
      ) : (
        <AnalisisTable analisis={recientes} compacta />
      )}
      <h2>Detalle por proyecto</h2>
      <table className="tabla">
        <thead>
          <tr>
            <th>Proyecto</th>
            <th>Hallazgos</th>
            <th>Aceptadas</th>
            <th>Rechazadas</th>
          </tr>
        </thead>
        <tbody>
          {datos.por_proyecto.map((p) => (
            <tr key={p.id_proyecto}>
              <td>{p.nombre}</td>
              <td>{p.hallazgos}</td>
              <td>{p.aceptadas}</td>
              <td>{p.rechazadas}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}