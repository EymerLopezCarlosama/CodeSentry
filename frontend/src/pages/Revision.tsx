// PROMPT — pages/Revision.tsx
//
// Pantalla para solicitar y seguir una revisión: SolicitudRevisionForm para el alcance, luego useAnalisis.iniciar y ProgresoAnalisis; al completar, botón hacia /analisis/:id/resultados.
// La pantalla une hooks/services con componentes; la lógica de datos va en hooks y el HTML repetible en components.
//
// Depende de: hooks/useAnalisis.ts + components/revision/*
// Referencia: HU-05, HU-06

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ProgresoAnalisis from "../components/revision/ProgresoAnalisis";
import SolicitudRevisionForm from "../components/revision/SolicitudRevisionForm";
import { useAnalisis } from "../hooks/useAnalisis";
import * as proyectosService from "../services/proyectos.service";
import type { Archivo, Proyecto } from "../types";

export default function Revision() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const idProyecto = Number(params.get("proyecto"));
  const idValido = Number.isInteger(idProyecto) && idProyecto > 0;

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [cargando, setCargando] = useState(idValido);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const { idAnalisis, estado, progreso, error, iniciar } = useAnalisis();

  useEffect(() => {
    if (!idValido) return;
    let activo = true;
    setCargando(true);
    setErrorCarga(null);

    Promise.all([
      proyectosService.obtener(idProyecto),
      proyectosService.listarArchivos(idProyecto),
    ])
      .then(([datosProyecto, datosArchivos]) => {
        if (!activo) return;
        setProyecto(datosProyecto);
        setArchivos(datosArchivos);
      })
      .catch((err) => {
        if (activo) setErrorCarga(err instanceof Error ? err.message : "Error desconocido.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idProyecto, idValido]);

  if (!idValido) {
    return (
      <section>
        <h1>Solicitar revisión</h1>
        <div className="tarjeta">
          <p>Elija un proyecto desde la lista para solicitar su revisión.</p>
          <Button onClick={() => navigate("/proyectos")}>Volver a proyectos</Button>
        </div>
      </section>
    );
  }

  const enCurso = estado === "pendiente" || estado === "en_proceso";

  return (
    <section style={{ display: "grid", gap: "16px" }}>
      <h1>Solicitar revisión</h1>

      {cargando && <Loader />}

      {!cargando && errorCarga && (
        <div className="tarjeta">
          <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
            {errorCarga}
          </p>
          <Button variante="secundario" onClick={() => navigate("/proyectos")}>
            Volver a proyectos
          </Button>
        </div>
      )}

      {!cargando && !errorCarga && proyecto && (
        <>
          <p style={{ margin: 0 }}>
            Proyecto: <strong>{proyecto.nombre}</strong> · Modelo: {proyecto.modelo_ia}
          </p>

          <SolicitudRevisionForm
            archivos={archivos}
            deshabilitado={enCurso}
            onIniciar={(objetivo, idArchivo) => void iniciar(idProyecto, objetivo, idArchivo)}
          />

          {error && (
            <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
              {error}
            </p>
          )}

          <ProgresoAnalisis estado={estado} progreso={progreso} />

          {estado === "fallido" && (
            <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
              El análisis falló. Compruebe que Ollama y el analyzer estén encendidos e inténtelo de nuevo.
            </p>
          )}

          {estado === "completado" && idAnalisis !== null && (
            <div>
              <Button onClick={() => navigate(`/analisis/${idAnalisis}/resultados`)}>
                Ver resultados
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}