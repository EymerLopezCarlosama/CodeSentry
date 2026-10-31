// Pantalla para solicitar y seguir una revisión como asistente de pasos:
// Proyecto → Alcance → Análisis → Resultados.
// Referencia: HU-05, HU-06

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import EncabezadoPagina from "../components/layout/EncabezadoPagina";
import Pasos from "../components/revision/Pasos";
import ProgresoAnalisis from "../components/revision/ProgresoAnalisis";
import SolicitudRevisionForm from "../components/revision/SolicitudRevisionForm";
import { useAnalisis } from "../hooks/useAnalisis";
import * as proyectosService from "../services/proyectos.service";
import type { Archivo, Proyecto } from "../types";

const PASOS = ["Proyecto", "Alcance", "Análisis", "Resultados"];
const DESCRIPCION = "Elige qué revisar y la IA local analiza tu código sin que salga de tu equipo.";

export default function Revision() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const idProyecto = Number(params.get("proyecto"));
  const idValido = Number.isInteger(idProyecto) && idProyecto > 0;

  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [cargando, setCargando] = useState(idValido);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const { idAnalisis, estado, progreso, error, iniciar, reiniciar } = useAnalisis();

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
        <EncabezadoPagina titulo="Solicitar revisión" descripcion={DESCRIPCION} />
        <div className="tarjeta">
          <p>Elija un proyecto desde la lista para solicitar su revisión.</p>
          <Button onClick={() => navigate("/proyectos")}>Volver a proyectos</Button>
        </div>
      </section>
    );
  }

  const terminado = estado === "completado";
  const fallido = estado === "fallido";
  const pasoActual = estado === null ? 2 : terminado ? 4 : 3;

  return (
    <section>
      <EncabezadoPagina titulo="Solicitar revisión" descripcion={DESCRIPCION} />

      {cargando && <Loader />}

      {!cargando && errorCarga && (
        <div className="tarjeta alerta-error">
          <p role="alert" className="mensaje-error">
            {errorCarga}
          </p>
          <Button variante="secundario" onClick={() => navigate("/proyectos")}>
            Volver a proyectos
          </Button>
        </div>
      )}

      {!cargando && !errorCarga && proyecto && (
        <div className="revision-flujo">
          <Pasos pasos={PASOS} actual={pasoActual} fallido={fallido} />

          <div className="tarjeta proyecto-resumen">
            <span className="proyecto-avatar" aria-hidden="true">
              {proyecto.nombre.trim().charAt(0).toUpperCase() || "P"}
            </span>
            <div className="proyecto-resumen-info">
              <h3>{proyecto.nombre}</h3>
              <p className="proyecto-ruta" title={proyecto.ruta_carpeta}>
                {proyecto.ruta_carpeta}
              </p>
            </div>
            <div className="chips">
              {proyecto.lenguajes.map((lenguaje) => (
                <span key={lenguaje} className={`chip chip-lang-${lenguaje.toLowerCase()}`}>
                  {lenguaje}
                </span>
              ))}
              <span className="chip chip-modelo">{proyecto.modelo_ia}</span>
            </div>
          </div>

          {estado === null && (
            <SolicitudRevisionForm
              archivos={archivos}
              onIniciar={(objetivo, idArchivo) => void iniciar(idProyecto, objetivo, idArchivo)}
            />
          )}

          {error && (
            <div className="tarjeta alerta-error" role="alert">
              <p className="mensaje-error">{error}</p>
              {estado !== null && (
                <Button variante="secundario" onClick={reiniciar}>
                  Volver a intentar
                </Button>
              )}
            </div>
          )}

          <ProgresoAnalisis estado={estado} progreso={progreso} />

          {fallido && (
            <div className="tarjeta alerta-error" role="alert">
              <p className="mensaje-error">
                El análisis falló. Compruebe que Ollama y el analyzer estén encendidos e inténtelo de nuevo.
              </p>
              <Button variante="secundario" onClick={reiniciar}>
                Volver a intentar
              </Button>
            </div>
          )}

          {terminado && idAnalisis !== null && (
            <div className="tarjeta alerta-exito" role="status">
              <h3>¡Análisis completado!</h3>
              <p>Ya puedes revisar los hallazgos, marcar el checklist o generar un reporte.</p>
              <div className="acciones-fila">
                <Button onClick={() => navigate(`/analisis/${idAnalisis}/resultados`)}>Ver resultados</Button>
                <Button variante="secundario" onClick={() => navigate(`/analisis/${idAnalisis}/checklist`)}>
                  Checklist
                </Button>
                <Button variante="secundario" onClick={() => navigate(`/analisis/${idAnalisis}/reporte`)}>
                  Reporte
                </Button>
                <Button variante="secundario" onClick={reiniciar}>
                  Nueva revisión
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}