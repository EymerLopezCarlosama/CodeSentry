import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import SeveridadBadge from "./SeveridadBadge";
import VisorCodigo from "./VisorCodigo";
import * as resultadosService from "../../services/resultados.service";
import type { ArchivoConHallazgos, EstadoChecklist, FragmentoCodigo, TipoHallazgo } from "../../types";

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

const CONTEXTO_BASICO = 6;
const CONTEXTO_AMPLIO = 20;

interface HallazgoCardProps {
  hallazgo: HallazgoDato;
  idAnalisis: number;
  resaltado?: boolean; // se llegó a esta tarjeta por un enlace directo
}

export default function HallazgoCard({ hallazgo, idAnalisis, resaltado = false }: HallazgoCardProps) {
  const [abierto, setAbierto] = useState(resaltado);
  const [contexto, setContexto] = useState(CONTEXTO_BASICO);
  const [fragmento, setFragmento] = useState<FragmentoCodigo | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);
  const tarjeta = useRef<HTMLElement>(null);

  // Al llegar por un enlace directo, baja hasta la tarjeta
  useEffect(() => {
    if (!resaltado) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tarjeta.current?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" });
  }, [resaltado]);

  // Carga el código al abrir (y otra vez si se pide más contexto o se reintenta)
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

  const hayMas = fragmento !== null && (fragmento.desde > 1 || fragmento.hasta < fragmento.total_lineas);
  const puedeAmpliar = contexto === CONTEXTO_BASICO && hayMas;
  const puedeReducir = contexto === CONTEXTO_AMPLIO;

  return (
    <article
      id={`hallazgo-${hallazgo.id_resultado}`}
      ref={tarjeta}
      className={`hallazgo sev-${hallazgo.severidad}${resaltado ? " resaltado" : ""}`}
    >
      <div className="hallazgo-cabecera">
        <SeveridadBadge severidad={hallazgo.severidad} />
        <span className="chip">{ETIQUETAS_TIPO[hallazgo.tipo] ?? hallazgo.tipo}</span>
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

          {!error && !cargando && (puedeAmpliar || puedeReducir) && (
            <div>
              <Button
                tamano="pequeno"
                variante="secundario"
                onClick={() => setContexto(puedeAmpliar ? CONTEXTO_AMPLIO : CONTEXTO_BASICO)}
              >
                {puedeAmpliar ? "Ver más contexto" : "Ver menos"}
              </Button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}