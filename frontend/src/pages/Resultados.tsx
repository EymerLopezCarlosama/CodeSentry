// PROMPT — pages/Resultados.tsx
//
// Pantalla de hallazgos de un análisis (GET /analisis/:id/resultados): filtro por severidad y ResultadoTable. Si el análisis no terminó, mostrar su estado en vez de una tabla vacía. Enlaces a Checklist y Reporte.
// La pantalla une hooks/services con componentes; la lógica de datos va en hooks y el HTML repetible en components.
//
// Depende de: services/resultados.service.ts + components/resultados/*
// Referencia: HU-07

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ResultadoTable from "../components/resultados/ResultadoTable";
import * as resultadosService from "../services/resultados.service";
import type { EstadoAnalisis, ResultadosAgrupados, Severidad } from "../types";

const OPCIONES_SEVERIDAD: { valor: Severidad | ""; texto: string }[] = [
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
  const navigate = useNavigate();

  const idAnalisis = Number(id);
  const idValido = Number.isInteger(idAnalisis) && idAnalisis > 0;

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
      .obtener(idAnalisis, severidad || undefined)
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
  }, [idAnalisis, idValido, severidad, version]);

  if (!idValido) {
    return (
      <section>
        <h1>Resultados del análisis</h1>
        <div className="tarjeta">
          <p>El análisis indicado no es válido.</p>
          <Button onClick={() => navigate("/proyectos")}>Volver a proyectos</Button>
        </div>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gap: "16px" }}>
      <h1>Resultados del análisis #{idAnalisis}</h1>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <Button variante="secundario" onClick={() => navigate(`/analisis/${idAnalisis}/checklist`)}>
          Ir al checklist
        </Button>
        <Button variante="secundario" onClick={() => navigate(`/analisis/${idAnalisis}/reporte`)}>
          Ir al reporte
        </Button>
        <Button variante="secundario" onClick={() => navigate("/proyectos")}>
          Volver a proyectos
        </Button>
      </div>

      {datos?.estado === "completado" && (
        <label style={{ display: "grid", gap: "4px", maxWidth: "240px" }}>
          Filtrar por severidad
          <select
            value={severidad}
            onChange={(e) => setSeveridad(e.target.value as Severidad | "")}
          >
            {OPCIONES_SEVERIDAD.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </select>
        </label>
      )}

      {cargando && <Loader />}

      {!cargando && error && (
        <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
          {error}
        </p>
      )}

      {!cargando && !error && datos && datos.estado !== "completado" && (
        <div className="tarjeta">
          <p>{MENSAJES_ESTADO[datos.estado]}</p>
          <Button onClick={() => setVersion((v) => v + 1)}>Actualizar</Button>
        </div>
      )}

      {!cargando && !error && datos?.estado === "completado" && datos.archivos.length === 0 && (
        <div className="tarjeta">
          <p style={{ margin: 0 }}>
            {severidad
              ? "No hay hallazgos con esa severidad."
              : "El análisis terminó sin hallazgos."}
          </p>
        </div>
      )}

      {!cargando && !error && datos?.estado === "completado" && (
        <ResultadoTable archivos={datos.archivos} />
      )}
    </section>
  );
}