// Historial de análisis: lista todos los análisis ejecutados (filtro por proyecto) con acceso directo
// a sus resultados, checklist y reporte, sin tener que escribir la URL.
// Depende de: services/revisiones.service.ts, services/proyectos.service.ts, components/analisis/*
// Referencia: HU-07, HU-10

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AnalisisTable from "../components/analisis/AnalisisTable";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import * as proyectosService from "../services/proyectos.service";
import * as revisionesService from "../services/revisiones.service";
import type { AnalisisResumen, Proyecto } from "../types";

export default function Analisis() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const proyectoParam = Number(params.get("proyecto"));
  const idProyecto = Number.isInteger(proyectoParam) && proyectoParam > 0 ? proyectoParam : undefined;

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [analisis, setAnalisis] = useState<AnalisisResumen[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // botón Actualizar

  useEffect(() => {
    proyectosService
      .listar()
      .then(setProyectos)
      .catch(() => setProyectos([])); // el filtro es opcional; si falla, la lista sigue funcionando
  }, []);

  useEffect(() => {
    let activo = true;
    setAnalisis(null);
    setError(null);
    revisionesService
      .listarAnalisis({ proyecto: idProyecto })
      .then((datos) => {
        if (activo) setAnalisis(datos);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : "Error desconocido.");
      });
    return () => {
      activo = false;
    };
  }, [idProyecto, version]);

  function cambiarProyecto(valor: string): void {
    if (valor) setParams({ proyecto: valor });
    else setParams({});
  }

  return (
    <section style={{ display: "grid", gap: "16px" }}>
      <h1>Historial de análisis</h1>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "end" }}>
        <label style={{ display: "grid", gap: "4px", minWidth: "240px" }}>
          Filtrar por proyecto
          <select value={idProyecto ?? ""} onChange={(e) => cambiarProyecto(e.target.value)}>
            <option value="">Todos los proyectos</option>
            {proyectos.map((p) => (
              <option key={p.id_proyecto} value={p.id_proyecto}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <Button variante="secundario" onClick={() => setVersion((v) => v + 1)}>
          Actualizar
        </Button>
      </div>

      {error && (
        <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
          {error}
        </p>
      )}

      {!error && analisis === null && <Loader />}

      {!error && analisis !== null && analisis.length === 0 && (
        <div className="tarjeta">
          <p style={{ marginTop: 0 }}>
            {idProyecto
              ? "Este proyecto aún no tiene análisis."
              : "Aún no se ha ejecutado ningún análisis."}
          </p>
          <Button onClick={() => navigate(idProyecto ? `/revision?proyecto=${idProyecto}` : "/proyectos")}>
            {idProyecto ? "Solicitar revisión" : "Ir a proyectos"}
          </Button>
        </div>
      )}

      {!error && analisis !== null && analisis.length > 0 && <AnalisisTable analisis={analisis} />}
    </section>
  );
}
