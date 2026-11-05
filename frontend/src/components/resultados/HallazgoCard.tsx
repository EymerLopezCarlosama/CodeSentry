import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import SeveridadBadge from "./SeveridadBadge";
import VisorCodigo from "./VisorCodigo";
import * as resultadosService from "../../services/resultados.service";
import type { ArchivoConHallazgos, EstadoChecklist, FragmentoCodigo, ReglaCatalogo, TipoHallazgo } from "../../types";

type HallazgoDato = ArchivoConHallazgos["hallazgos"][number];

const ETIQUETAS_TIPO: Record<TipoHallazgo, string> = {
  vulnerabilidad: "Vulnerabilidad",
  mala_practica: "Mala práctica",
  refactorizacion: "Refactorización",
};

const ETIQUETAS_CHECKLIST: Record<EstadoChecklist, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

// Cuánto código se muestra: líneas a cada lado de la marcada
const NIVELES = [
  { etiqueta: "Solo la línea", contexto: 0 },
  { etiqueta: "Cerca", contexto: 2 },
  { etiqueta: "Normal", contexto: 6 },
  { etiqueta: "Amplio", contexto: 20 },
];
const CONTEXTO_INICIAL = 2;

interface HallazgoCardProps {
  hallazgo: HallazgoDato;
  regla?: ReglaCatalogo;
  idAnalisis: number;
  resaltado?: boolean; // se llegó a esta tarjeta por un enlace directo
}

export default function HallazgoCard({ hallazgo, regla, idAnalisis, resaltado = false }: HallazgoCardProps) {
  const [abierto, setAbierto] = useState(resaltado);
  const [contexto, setContexto] = useState(CONTEXTO_INICIAL);
  const [fragmento, setFragmento] = useState<FragmentoCodigo | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);
  const tarjeta = useRef<HTMLElement>(null);

  // Al cambiar 'resaltado', asegura que el visor se abra
  useEffect(() => {
    if (resaltado) {
      setAbierto(true);
    }
  }, [resaltado]);

  // Al llegar por un enlace directo, espera al montado en el DOM y baja hasta la tarjeta
  useEffect(() => {
    if (!resaltado) return;
    const timer = setTimeout(() => {
      const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      tarjeta.current?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" });
    }, 100);

    return () => clearTimeout(timer);
  }, [resaltado]);

  // Carga el código al abrir (y otra vez si cambia el nivel o se reintenta)
  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    setCargando(true);
    setError(null);
    resultadosService
      .obtenerCodigo(hallazgo.id_resultado, contexto)
      .then((f) => {
        if (activo) setFragmento(f);
      })
      .catch((err) => {
        if (activo) setError(err instanceof Error ? err.message : "No se pudo cargar el código.");
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [abierto, contexto, intento, hallazgo.id_resultado]);

  async function copiarEnlace(): Promise<void> {
    const url = `${window.location.origin}/analisis/${idAnalisis}/resultados#hallazgo-${hallazgo.id_resultado}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado("si");
    } catch {
      setCopiado("no");
    }
    window.setTimeout(() => setCopiado(null), 2000);
  }

  return (
    <article
      id={`hallazgo-${hallazgo.id_resultado}`}
      ref={tarjeta}
      className={`hallazgo sev-${hallazgo.severidad}${resaltado ? " resaltado" : ""}`}
    >
      <div className="hallazgo-cabecera">
        <SeveridadBadge severidad={hallazgo.severidad} />
        <span className="chip">{ETIQUETAS_TIPO[hallazgo.tipo] ?? hallazgo.tipo}</span>
        {hallazgo.regla && (
          <span className="chip chip-regla" title={regla?.descripcion ?? hallazgo.regla}>
            {hallazgo.regla}
          </span>
        )}
        {regla?.cwe && (
          <span className="chip" title={`ISO/IEC 25010: ${regla.iso25010}`}>
            {regla.cwe} · {regla.iso25010}
          </span>
        )}
        <span className="hallazgo-linea">Línea {hallazgo.linea_codigo}</span>
        <span className={`chip chip-check-${hallazgo.estado_checklist}`}>
          {ETIQUETAS_CHECKLIST[hallazgo.estado_checklist] ?? hallazgo.estado_checklist}
        </span>
      </div>

      <p className="hallazgo-descripcion">{hallazgo.descripcion}</p>

      <div className="acciones-fila">
        <Button tamano="pequeno" variante="secundario" onClick={() => setAbierto((a) => !a)}>
          {abierto ? "Ocultar código" : "Ver código"}
        </Button>
        <Button tamano="pequeno" variante="secundario" onClick={() => void copiarEnlace()}>
          {copiado === "si" ? "¡Enlace copiado!" : copiado === "no" ? "No se pudo copiar" : "Copiar enlace"}
        </Button>
      </div>

      {abierto && (
        <div className="hallazgo-codigo">
          <div className="contexto-selector" role="group" aria-label="Cantidad de código a mostrar">
            <span className="contexto-titulo">Mostrar:</span>
            {NIVELES.map((nivel) => (
              <button
                key={nivel.contexto}
                type="button"
                className={`contexto-op${contexto === nivel.contexto ? " activo" : ""}`}
                aria-pressed={contexto === nivel.contexto}
                onClick={() => setContexto(nivel.contexto)}
              >
                {nivel.etiqueta}
              </button>
            ))}
          </div>

          {error && (
            <div>
              <p className="mensaje-error" role="alert">
                {error}
              </p>
              <Button tamano="pequeno" variante="secundario" onClick={() => setIntento((i) => i + 1)}>
                Reintentar
              </Button>
            </div>
          )}

          {!error && fragmento && <VisorCodigo fragmento={fragmento} severidad={hallazgo.severidad} />}

          {cargando && <small role="status">Cargando código...</small>}
        </div>
      )}
    </article>
  );
}