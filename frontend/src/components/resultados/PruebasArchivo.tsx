// Botón "Generar pruebas" de un archivo (HU-12): pide las pruebas a la IA local y las muestra para
// copiar o descargar. Solo lectura: nunca escribe nada en el proyecto del usuario.
// Referencia: HU-12

import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import * as archivosService from "../../services/archivos.service";
import type { PruebasGeneradas } from "../../types";

interface PruebasArchivoProps {
  idArchivo: number;
  rutaRelativa: string;
}

const NOMBRE_FRAMEWORK = { jest: "Jest", pytest: "PyTest" } as const;

// Las pruebas ya generadas sobreviven a un cambio de filtro (que vuelve a montar la tabla).
const cache = new Map<number, PruebasGeneradas>();

export default function PruebasArchivo({ idArchivo, rutaRelativa }: PruebasArchivoProps) {
  const [pruebas, setPruebas] = useState<PruebasGeneradas | null>(() => cache.get(idArchivo) ?? null);
  const [generando, setGenerando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [copiado, setCopiado] = useState<"si" | "no" | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (!generando) return;
    setSegundos(0);
    const t = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [generando]);

  async function generar(): Promise<void> {
    setGenerando(true);
    setError(null);
    try {
      const resultado = await archivosService.generarPruebas(idArchivo);
      cache.set(idArchivo, resultado);
      if (!montado.current) return;
      setPruebas(resultado);
      setVisible(true);
    } catch (err) {
      if (montado.current) {
        setError(err instanceof Error ? err.message : "No se pudieron generar las pruebas.");
      }
    } finally {
      if (montado.current) setGenerando(false);
    }
  }

  async function copiar(): Promise<void> {
    if (!pruebas) return;
    try {
      await navigator.clipboard.writeText(pruebas.contenido);
      setCopiado("si");
    } catch {
      setCopiado("no");
    }
    window.setTimeout(() => setCopiado(null), 2000);
  }

  // Descarga al equipo del usuario (carpeta de descargas); no escribe en el proyecto.
  function descargar(): void {
    if (!pruebas) return;
    const blob = new Blob([pruebas.contenido], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = pruebas.archivo_sugerido;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  const etiqueta = generando
    ? `Generando… ${segundos} s`
    : error
      ? "Reintentar"
      : pruebas
        ? "Regenerar pruebas"
        : "Generar pruebas";

  return (
    <div className="pruebas">
      <div className="acciones-fila">
        <Button tamano="pequeno" variante="secundario" onClick={() => void generar()} disabled={generando}>
          {etiqueta}
        </Button>
        {pruebas && !generando && (
          <Button tamano="pequeno" variante="secundario" onClick={() => setVisible((v) => !v)}>
            {visible ? "Ocultar pruebas" : "Ver pruebas"}
          </Button>
        )}
      </div>

      {generando && (
        <small role="status">
          La IA local está escribiendo las pruebas de {rutaRelativa}. Puede tardar hasta un par de minutos.
        </small>
      )}

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      {pruebas && visible && (
        <div className="pruebas-panel">
          <div className="pruebas-cabecera">
            <span className="chip chip-modelo">{NOMBRE_FRAMEWORK[pruebas.framework]}</span>
            <code className="pruebas-nombre">{pruebas.archivo_sugerido}</code>
            <span className="pruebas-acciones">
              <Button tamano="pequeno" variante="secundario" onClick={() => void copiar()}>
                {copiado === "si" ? "¡Copiado!" : copiado === "no" ? "No se pudo copiar" : "Copiar"}
              </Button>
              <Button tamano="pequeno" variante="secundario" onClick={descargar}>
                Descargar
              </Button>
            </span>
          </div>
          {pruebas.aviso && (
            <p className="pruebas-aviso" role="note">
              {pruebas.aviso}
            </p>
          )}
          <pre className="pruebas-codigo">
            <code>{pruebas.contenido}</code>
          </pre>
          <small className="pruebas-nota">
            Solo se muestran: CodeSentry no escribe nada en tu proyecto. Guárdalas junto al archivo y revísalas
            antes de usarlas.
          </small>
        </div>
      )}
    </div>
  );
}