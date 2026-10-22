import { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import * as modelosService from "../../services/modelos.service";
import { ErrorApi } from "../../services/api";

// Datos informativos de los modelos permitidos (el backend solo devuelve los nombres)
const INFO_MODELOS: Record<string, { tamano: string; licencia: string }> = {
  "qwen2.5-coder": { tamano: "~4.7 GB", licencia: "Apache 2.0" },
  llama3: { tamano: "~4.7 GB", licencia: "Llama 3 Community License" },
};

const INTERVALO_MS = 2000;

interface InstalarModeloModalProps {
  abierto: boolean;
  modelos: string[]; // permitidos
  onCerrar: () => void;
  onInstalado: (modelo: string) => void;
}

function mensajeError(err: unknown): string {
  if (err instanceof ErrorApi) {
    if (err.codigo === "OLLAMA_NO_DISPONIBLE" || err.codigo === "ANALYZER_NO_DISPONIBLE") {
      return "Ollama no está disponible. Enciéndelo (y el analyzer) e inténtalo de nuevo.";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Error desconocido.";
}

export default function InstalarModeloModal({
  abierto,
  modelos,
  onCerrar,
  onInstalado,
}: InstalarModeloModalProps) {
  const [seleccionado, setSeleccionado] = useState(modelos[0] ?? "");
  const [acepto, setAcepto] = useState(false);
  const [instalando, setInstalando] = useState(false);
  const [porcentaje, setPorcentaje] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const temporizador = useRef<ReturnType<typeof setInterval> | null>(null);

  function detener(): void {
    if (temporizador.current) clearInterval(temporizador.current);
    temporizador.current = null;
  }

  // Limpia el intervalo al desmontar
  useEffect(() => detener, []);

  // Reinicia el estado cada vez que se abre
  useEffect(() => {
    if (abierto) {
      setSeleccionado(modelos[0] ?? "");
      setAcepto(false);
      setInstalando(false);
      setPorcentaje(0);
      setError(null);
    } else {
      detener();
    }
  }, [abierto, modelos]);

  if (!abierto) return null;

  const info = INFO_MODELOS[seleccionado] ?? { tamano: "desconocido", licencia: "ver ollama.com" };

  function seguirProgreso(modelo: string): void {
    detener();
    temporizador.current = setInterval(() => {
      void (async () => {
        try {
          const estado = await modelosService.progreso(modelo);
          setPorcentaje(modelosService.porcentaje(estado.progreso));
          if (estado.estado === "completado") {
            detener();
            setInstalando(false);
            onInstalado(modelo);
          } else if (estado.estado === "fallido") {
            detener();
            setInstalando(false);
            setError(estado.motivo ?? "La descarga falló. Inténtalo de nuevo.");
          }
        } catch (err) {
          detener();
          setInstalando(false);
          setError(mensajeError(err));
        }
      })();
    }, INTERVALO_MS);
  }

  async function instalar(): Promise<void> {
    setError(null);
    setPorcentaje(0);
    setInstalando(true);
    try {
      const estado = await modelosService.instalar(seleccionado);
      if (estado.estado === "completado") {
        setInstalando(false);
        onInstalado(seleccionado);
      } else {
        seguirProgreso(seleccionado);
      }
    } catch (err) {
      setInstalando(false);
      setError(mensajeError(err));
    }
  }

  return (
    <div className="modal-fondo">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="instalar-titulo">
        <h2 id="instalar-titulo">Instalar modelo de Ollama</h2>
        <p>No hay modelos instalados. Instala uno para poder analizar tu código en local.</p>

        <label style={{ display: "grid", gap: "4px" }}>
          Modelo
          <select
            value={seleccionado}
            onChange={(e) => setSeleccionado(e.target.value)}
            disabled={instalando}
          >
            {modelos.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <ul>
          <li>
            <strong>Nombre:</strong> {seleccionado}
          </li>
          <li>
            <strong>Tamaño:</strong> {info.tamano}
          </li>
          <li>
            <strong>Licencia:</strong> {info.licencia}
          </li>
        </ul>

        <label>
          <input
            type="checkbox"
            checked={acepto}
            onChange={(e) => setAcepto(e.target.checked)}
            disabled={instalando}
          />{" "}
          Acepto la licencia y la descarga del modelo
        </label>

        {instalando && (
          <div style={{ marginTop: "16px" }}>
            <progress value={porcentaje} max={100} style={{ width: "100%" }} />
            <small>
              {porcentaje > 0 ? `${porcentaje} %` : "Iniciando descarga..."} (no cierres esta ventana)
            </small>
          </div>
        )}

        {error && (
          <p role="alert" style={{ color: "var(--color-peligro)" }}>
            {error}
          </p>
        )}

        <div className="modal-acciones">
          <Button variante="secundario" onClick={onCerrar} disabled={instalando}>
            Cerrar
          </Button>
          <Button onClick={() => void instalar()} disabled={!acepto || instalando || !seleccionado}>
            {instalando ? "Instalando..." : "Instalar"}
          </Button>
        </div>
      </div>
    </div>
  );
}