// Pantalla de hallazgos de un análisis (GET /analisis/:id/resultados): filtro por severidad, tarjetas con
// visor de código y enlaces directos. Si el análisis no terminó, muestra su estado.
// Referencia: HU-07

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import EncabezadoPagina from "../components/layout/EncabezadoPagina";
import ResultadoTable from "../components/resultados/ResultadoTable";
import * as resultadosService from "../services/resultados.service";
import type { EstadoAnalisis, ResultadosAgrupados, Severidad } from "../types";

const FILTROS: { valor: Severidad | ""; texto: string }[] = [
  { valor: "", texto: "Todas" },
  { valor: "critica", texto: "Crítica" },
  { valor: "alta", texto: "Alta" },
  { valor: "media", texto: "Media" },
  { valor: "baja", texto: "Baja" },
];

const MENSAJES_ESTADO: Record<Exclude<EstadoAnalisis, "completado">, string> = {
  pendiente: "El análisis está pendiente de iniciar.",
  en_proceso: "El análisis sigue en proceso. Vuelva a consultar en unos segundos.",
  fallido:
    "El análisis falló, por lo que no hay resultados. Compruebe que Ollama y el analyzer estén encendidos y solicite una nueva revisión.",
};

export default function Resultados() {
  const { id } = useParams();
  const { hash } = useLocation();
  const navigate = useNavigate();

  const idAnalisis = Number(id);
  const idValido = Number.isInteger(idAnalisis) && idAnalisis > 0;

  // Enlace directo a un hallazgo: /analisis/14/resultados#hallazgo-43
  const coincidencia = /^#hallazgo-(\d+)$/.exec(hash);
  const idResaltado = coincidencia ? Number(coincidencia[1]) : null;

  const [severidad, setSeveridad] = useState<Severidad | "">("");
  const [datos, setDatos] = useState<ResultadosAgrupados | null>(null);
  const [cargando, setCargando] = useState(idValido);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0); // al subirla se vuelve a pedir (botón Actualizar)

  useEffect(() => {
    if (!idValido) return;
    let activo = true;
    setCargando(true);
    setError(null);

    resultadosService
      .obtener(idAnalisis)
      .then((respuesta) => {
        if (activo) setDatos(respuesta);
      })
      .catch((err) => {
        if (!activo) return;
        setDatos(null);
        setError(err instanceof Error ? err.message : "Error desconocido.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [idAnalisis, idValido, version]);

  // Conteos por severidad y filtrado en el navegador (una sola petición)
  const conteos = useMemo(() => {
    const c: Record<Severidad, number> = { critica: 0, alta: 0, media: 0, baja: 0 };
    datos?.archivos.forEach((a) =>
      a.hallazgos.forEach((h) => {
        c[h.severidad] += 1;
      })
    );
    return c;
  }, [datos]);
  const total = conteos.critica + conteos.alta + conteos.media + conteos.baja;

  const archivosVisibles = useMemo(() => {
    if (!datos) return [];
    if (!severidad) return datos.archivos;
    return datos.archivos
      .map((a) => ({ ...a, hallazgos: a.hallazgos.filter((h) => h.severidad === severidad) }))
      .filter((a) => a.hallazgos.length > 0);
  }, [datos, severidad]);

  if (!idValido) {
    return (
      <section>
        <EncabezadoPagina titulo="Resultados del análisis" />
        <div className="tarjeta">
          <p>El análisis indicado no es válido.</p>
          <Button onClick={() => navigate("/proyectos")}>Volver a proyectos</Button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <EncabezadoPagina
        titulo={`Resultados del análisis #${idAnalisis}`}
        descripcion="Hallazgos agrupados por archivo, de mayor a menor severidad."
      >
        <Button variante="secundario" onClick={() => navigate(`/analisis/${idAnalisis}/checklist`)}>
          Ir al checklist
        </Button>
        <Button variante="secundario" onClick={() => navigate(`/analisis/${idAnalisis}/reporte`)}>
          Ir al reporte
        </Button>
        <Button variante="secundario" onClick={() => navigate("/proyectos")}>
          Volver a proyectos
        </Button>
      </EncabezadoPagina>

      {cargando && <Loader />}

      {!cargando && error && (
        <div className="tarjeta alerta-error" role="alert">
          <p className="mensaje-error">{error}</p>
          <Button variante="secundario" onClick={() => setVersion((v) => v + 1)}>
            Reintentar
          </Button>
        </div>
      )}

      {!cargando && !error && datos && datos.estado !== "completado" && (
        <div className="tarjeta">
          <p>{MENSAJES_ESTADO[datos.estado]}</p>
          <Button onClick={() => setVersion((v) => v + 1)}>Actualizar</Button>
        </div>
      )}

      {!cargando && !error && datos?.estado === "completado" && total === 0 && (
        <div className="tarjeta">
          <p style={{ margin: 0 }}>El análisis terminó sin hallazgos.</p>
        </div>
      )}

      {!cargando && !error && datos?.estado === "completado" && total > 0 && (
        <>
          {datos.explicaciones_ia != null && (
            <p className="analisis-origen">
              <span className={`chip${datos.explicaciones_ia > 0 ? " chip-modelo" : ""}`}>
                {datos.explicaciones_ia > 0
                  ? `Explicaciones con IA local: ${datos.explicaciones_ia} de ${total}`
                  : "Solo reglas: descripciones estándar"}
              </span>
            </p>
          )}
          <div className="filtros-severidad" role="group" aria-label="Filtrar por severidad">
            {FILTROS.map((filtro) => {
              const cantidad = filtro.valor === "" ? total : conteos[filtro.valor];
              const activo = severidad === filtro.valor;
              return (
                <button
                  key={filtro.valor || "todas"}
                  type="button"
                  className={`filtro-chip${filtro.valor ? ` sev-${filtro.valor}` : ""}${activo ? " activo" : ""}`}
                  onClick={() => setSeveridad(filtro.valor)}
                  disabled={filtro.valor !== "" && cantidad === 0}
                  aria-pressed={activo}
                >
                  {filtro.texto} <span className="filtro-n">{cantidad}</span>
                </button>
              );
            })}
          </div>

          <ResultadoTable
            key={severidad}
            archivos={archivosVisibles}
            idAnalisis={idAnalisis}
            idResaltado={idResaltado}
            filtrado={severidad !== ""}
          />
        </>
      )}
    </section>
  );
}