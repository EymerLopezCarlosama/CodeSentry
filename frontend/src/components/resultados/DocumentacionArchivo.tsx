// Botón "Generar documentación" de un archivo (HU-11): pide a la IA local los docstrings/JSDoc y un resumen
// y los muestra para copiar o descargar. Solo lectura: nunca modifica el archivo del usuario.
// Reutiliza los estilos del panel de pruebas (HU-12).
// Referencia: HU-11

import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import * as archivosService from "../../services/archivos.service";
import type { DocumentacionGenerada } from "../../types";

interface DocumentacionArchivoProps {
  idArchivo: number;
  rutaRelativa: string;
}

// La documentación ya generada sobrevive a un cambio de filtro (que vuelve a montar la tabla).
const cache = new Map<number, DocumentacionGenerada>();

export default function DocumentacionArchivo({ idArchivo, rutaRelativa }: DocumentacionArchivoProps) {
  const [documentacion, setDocumentacion] = useState<DocumentacionGenerada | null>(() => cache.get(idArchivo) ?? null);
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
      const resultado = await archivosService.generarDocumentacion(idArchivo);
      cache.set(idArchivo, resultado);
      if (!montado.current) return;
      setDocumentacion(resultado);
      setVisible(true);
    } catch (err) {
      if (montado.current) {
        setError(err instanceof Error ? err.message : "No se pudo generar la documentación.");
      }
    } finally {
      if (montado.current) setGenerando(false);
    }
  }

  async function copiar(): Promise<void> {
    if (!documentacion) return;
    try {
      await navigator.clipboard.writeText(documentacion.contenido);
      setCopiado("si");
    } catch {
      setCopiado("no");
    }
    window.setTimeout(() => setCopiado(null), 2000);
  }

  // Descarga al equipo del usuario (carpeta de descargas); no escribe en el proyecto.
  function descargar(): void {
    if (!documentacion) return;
    const blob = new Blob([documentacion.contenido], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = documentacion.archivo_sugerido;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
  }

  const etiqueta = generando
    ? `Generando… ${segundos} s`
    : error
      ? "Reintentar"
      : documentacion
        ? "Regenerar documentación"
        : "Generar documentación";

  return (
    <div className="pruebas">
      <div className="acciones-fila">
        <Button tamano="pequeno" variante="secundario" onClick={() => void generar()} disabled={generando}>
          {etiqueta}
        </Button>
        {documentacion && !generando && (
          <Button tamano="pequeno" variante="secundario" onClick={() => setVisible((v) => !v)}>
            {visible ? "Ocultar documentación" : "Ver documentación"}
          </Button>
        )}
      </div>

      {generando && (
        <small role="status">
          La IA local está documentando {rutaRelativa}. Puede tardar hasta un par de minutos.
        </small>
      )}

      {error && (
        <p className="mensaje-error" role="alert">
          {error}
        </p>
      )}

      {documentacion && visible && (
        <div className="pruebas-panel">
          <div className="pruebas-cabecera">
            <span className="chip chip-modelo">Markdown</span>
            <code className="pruebas-nombre">{documentacion.archivo_sugerido}</code>
            <span className="pruebas-acciones">
              <Button tamano="pequeno" variante="secundario" onClick={() => void copiar()}>
                {copiado === "si" ? "¡Copiado!" : copiado === "no" ? "No se pudo copiar" : "Copiar"}
              </Button>
              <Button tamano="pequeno" variante="secundario" onClick={descargar}>
                Descargar
              </Button>
            </span>
          </div>
          {documentacion.aviso && (
            <p className="pruebas-aviso" role="note">
              {documentacion.aviso}
            </p>
          )}
          <pre className="pruebas-codigo">
            <code>{documentacion.contenido}</code>
          </pre>
          <small className="pruebas-nota">
            Solo se muestra: CodeSentry no modifica tu archivo. Copia los docstrings encima de cada función y
            revísalos antes de usarlos.
          </small>
        </div>
      )}
    </div>
  );
}
