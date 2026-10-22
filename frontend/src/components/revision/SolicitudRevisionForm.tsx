// PROMPT — components/revision/SolicitudRevisionForm.tsx
//
// Formulario para elegir el alcance de la revisión: toda la carpeta del proyecto o un archivo puntual (lista de GET /proyectos/:id/archivos, solo .js/.ts/.py). Props: idProyecto, onIniciar.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
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
    <form
      className="tarjeta"
      onSubmit={manejarEnvio}
      style={{ display: "grid", gap: "16px", maxWidth: "560px" }}
    >
      {sinArchivos && (
        <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
          Este proyecto no tiene archivos .js, .ts ni .py para revisar.
        </p>
      )}

      <fieldset style={{ display: "grid", gap: "4px" }}>
        <legend>¿Qué desea revisar?</legend>
        <label>
          <input
            type="radio"
            name="objetivo"
            checked={objetivo === "carpeta"}
            onChange={() => setObjetivo("carpeta")}
          />{" "}
          Toda la carpeta del proyecto
        </label>
        <label>
          <input
            type="radio"
            name="objetivo"
            checked={objetivo === "archivo"}
            onChange={() => setObjetivo("archivo")}
          />{" "}
          Un archivo puntual
        </label>
      </fieldset>

      {objetivo === "archivo" && (
        <label style={{ display: "grid", gap: "4px" }}>
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
        <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
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