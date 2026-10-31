import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import * as reportesService from "../services/reportes.service";
import { formatearFecha } from "../utils/format";
import type { FormatoReporte, Reporte as ReporteTipo } from "../types";

const FORMATOS: FormatoReporte[] = ["json", "html", "pdf"];

export default function Reporte() {
  const { id } = useParams();
  const idAnalisis = Number(id);
  const idValido = Number.isInteger(idAnalisis) && idAnalisis > 0;

  const [reportes, setReportes] = useState<ReporteTipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null);
  const [generando, setGenerando] = useState<FormatoReporte | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setCargando(true);
    setError(null);
    try {
      setReportes(await reportesService.listar(idAnalisis));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setCargando(false);
    }
  }, [idAnalisis]);

  useEffect(() => {
    if (idValido) void cargar();
    else {
      setError("El identificador del análisis no es válido.");
      setCargando(false);
    }
  }, [cargar, idValido]);

  async function generar(formato: FormatoReporte): Promise<void> {
    setErrorGenerar(null);
    setGenerando(formato);
    try {
      await reportesService.generar(idAnalisis, formato);
      await cargar();
    } catch (err) {
      setErrorGenerar(err instanceof Error ? err.message : "No se pudo generar el reporte.");
    } finally {
      setGenerando(null);
    }
  }

  return (
    <section>
      <h1>Reportes del análisis #{idValido ? idAnalisis : "?"}</h1>

      {idValido && (
        <div className="tarjeta" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {FORMATOS.map((f) => (
            <Button key={f} disabled={generando !== null} onClick={() => void generar(f)}>
              {generando === f ? "Generando..." : `Generar ${f.toUpperCase()}`}
            </Button>
          ))}
        </div>
      )}

      {errorGenerar && (
        <p role="alert" style={{ color: "var(--color-peligro)" }}>
          {errorGenerar}
        </p>
      )}

      {cargando && <Loader />}

      {!cargando && error && (
        <div className="tarjeta">
          <p>{error}</p>
          {idValido && <Button onClick={() => void cargar()}>Reintentar</Button>}
        </div>
      )}

      {!cargando && !error && reportes.length === 0 && (
        <div className="tarjeta">
          <p>Aún no hay reportes generados para este análisis.</p>
        </div>
      )}

      {!cargando && !error && reportes.length > 0 && (
        <table className="tabla" style={{ marginTop: "16px" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Formato</th>
              <th>Fecha</th>
              <th>Descarga</th>
            </tr>
          </thead>
          <tbody>
            {reportes.map((r) => (
              <tr key={r.id_reporte}>
                <td>{r.id_reporte}</td>
                <td>{r.formato.toUpperCase()}</td>
                <td>{formatearFecha(r.fecha_generacion)}</td>
                <td>
                  <a href={reportesService.urlDescarga(r.id_reporte)}>Descargar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}