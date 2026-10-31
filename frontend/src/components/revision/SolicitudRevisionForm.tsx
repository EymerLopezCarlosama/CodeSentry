// Formulario para elegir el alcance de la revisión: toda la carpeta del proyecto o un archivo puntual
// (lista de GET /proyectos/:id/archivos). Componente de presentación (sin llamadas a la API).
// Referencia: HU-05

import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../common/Button";
import type { Archivo, TipoObjetivo } from "../../types";

interface SolicitudRevisionFormProps {
  archivos: Archivo[];
  onIniciar: (objetivo: TipoObjetivo, idArchivo?: number) => void;
  deshabilitado?: boolean;
}

export default function SolicitudRevisionForm({
  archivos,
  onIniciar,
  deshabilitado = false,
}: SolicitudRevisionFormProps) {
  const [objetivo, setObjetivo] = useState<TipoObjetivo>("carpeta");
  const [idArchivo, setIdArchivo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sinArchivos = archivos.length === 0;

  function manejarEnvio(evento: FormEvent<HTMLFormElement>): void {
    evento.preventDefault();
    setError(null);

    if (objetivo === "archivo") {
      if (idArchivo === null) return setError("Seleccione un archivo.");
      onIniciar("archivo", idArchivo);
      return;
    }
    onIniciar("carpeta");
  }

  return (
    <form className="tarjeta revision-form" onSubmit={manejarEnvio}>
      {sinArchivos && (
        <p role="alert" className="mensaje-error">
          Este proyecto no tiene archivos .js, .jsx, .ts, .tsx ni .py para revisar.
        </p>
      )}

      <fieldset className="alcance-opciones">
        <legend>¿Qué desea revisar?</legend>

        <label className={`opcion-alcance${objetivo === "carpeta" ? " activa" : ""}`}>
          <input
            type="radio"
            name="objetivo"
            checked={objetivo === "carpeta"}
            onChange={() => setObjetivo("carpeta")}
          />
          <span>
            <strong>Toda la carpeta del proyecto</strong>
            <small>{archivos.length} archivos analizables</small>
          </span>
        </label>

        <label className={`opcion-alcance${objetivo === "archivo" ? " activa" : ""}`}>
          <input
            type="radio"
            name="objetivo"
            checked={objetivo === "archivo"}
            onChange={() => setObjetivo("archivo")}
          />
          <span>
            <strong>Un archivo puntual</strong>
            <small>Más rápido: ideal para probar</small>
          </span>
        </label>
      </fieldset>

      {objetivo === "archivo" && (
        <label className="campo">
          Archivo
          <select
            value={idArchivo ?? ""}
            onChange={(e) => setIdArchivo(e.target.value === "" ? null : Number(e.target.value))}
          >
            <option value="">Seleccione un archivo...</option>
            {archivos.map((archivo) => (
              <option key={archivo.id_archivo} value={archivo.id_archivo}>
                {archivo.ruta_relativa}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <p role="alert" className="mensaje-error">
          {error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={deshabilitado || sinArchivos}>
          Iniciar revisión
        </Button>
      </div>
    </form>
  );
}