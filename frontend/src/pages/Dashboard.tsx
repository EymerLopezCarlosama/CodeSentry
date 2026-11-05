import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnalisisTable from "../components/analisis/AnalisisTable";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import GraficoChecklist from "../components/dashboard/GraficoChecklist";
import GraficoSeveridad from "../components/dashboard/GraficoSeveridad";
import KpiCards from "../components/dashboard/KpiCards";
import TablaReglas from "../components/dashboard/TablaReglas";
import Bienvenida from "../components/layout/Bienvenida";
import EncabezadoPagina from "../components/layout/EncabezadoPagina";
import * as dashboardService from "../services/dashboard.service";
import * as estadisticasService from "../services/estadisticas.service";
import * as revisionesService from "../services/revisiones.service";
import type { AnalisisResumen, Dashboard as DatosDashboard, EstadisticaRegla } from "../types";

const DESCRIPCION = "Estado general de tus proyectos, hallazgos y revisiones.";

export default function Dashboard() {
  const [datos, setDatos] = useState<DatosDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recientes, setRecientes] = useState<AnalisisResumen[]>([]);
  const [reglas, setReglas] = useState<EstadisticaRegla[]>([]);
  const navigate = useNavigate();

  // Calidad de las reglas: si falla no bloquea el dashboard
  useEffect(() => {
    let activo = true;
    estadisticasService
      .porRegla()
      .then((r) => {
        if (activo && Array.isArray(r)) {
          setReglas(r);
        }
      })
      .catch(() => undefined);
    return () => {
      activo = false;
    };
  }, []);

  // Últimos análisis: si falla no bloquea el dashboard
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
        <EncabezadoPagina titulo="Dashboard" descripcion={DESCRIPCION} />
        <div className="tarjeta">
          <p className="mensaje-error">{error}</p>
        </div>
      </>
    );
  }

  if (!datos) {
    return (
      <>
        <EncabezadoPagina titulo="Dashboard" descripcion={DESCRIPCION} />
        <Loader />
      </>
    );
  }

  if (datos.totales.proyectos === 0) {
    return (
      <>
        <EncabezadoPagina titulo="Dashboard" descripcion={DESCRIPCION} />
        <EmptyState />
      </>
    );
  }

  return (
    <>
      <EncabezadoPagina titulo="Dashboard" descripcion={DESCRIPCION}>
        <Button onClick={() => navigate("/proyectos/nuevo")}>Nuevo proyecto</Button>
      </EncabezadoPagina>

      <Bienvenida />

      <KpiCards datos={datos} />

      <div className="graficos-grid">
        <GraficoSeveridad por_severidad={datos.por_severidad} />
        <GraficoChecklist checklist={datos.checklist} />
      </div>

      {reglas.length > 0 && (
        <>
          <div className="seccion-titulo">
            <h2>Calidad de las reglas</h2>
          </div>
          <p className="texto-suave" style={{ marginBottom: "var(--espacio-3)" }}>
            Medida con tus decisiones en el checklist. Con menos de 10 hallazgos marcados por regla no se
            saca ninguna conclusión, y el sistema solo sugiere: nunca cambia una regla por su cuenta.
          </p>
          <TablaReglas estadisticas={reglas} />
        </>
      )}

      <div className="seccion-titulo">
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

      <div className="seccion-titulo">
        <h2>Detalle por proyecto</h2>
      </div>
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