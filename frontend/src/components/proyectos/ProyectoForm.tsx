// PROMPT — components/proyectos/ProyectoForm.tsx
//
// Formulario para crear/editar un proyecto: nombre, ruta de la carpeta, selector de modelo de Ollama (GET /modelos) y lenguajes (JavaScript/TypeScript/Python). Muestra los errores del backend (RUTA_INEXISTENTE, RUTA_DUPLICADA). Props: valores iniciales, onGuardar.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-01, HU-03

import { useState } from "react";
import type { FormEvent } from "react";
import Button from "../common/Button";
import type { DatosNuevoProyecto, NombreLenguaje } from "../../types";

const LENGUAJES: NombreLenguaje[] = ["JavaScript", "TypeScript", "Python"];
const MODELO_POR_DEFECTO = "qwen2.5-coder";

interface ProyectoFormProps {
  valoresIniciales?: Partial<DatosNuevoProyecto>;
  onGuardar: (datos: DatosNuevoProyecto) => Promise<void>;
  textoBoton?: string;
}

export default function ProyectoForm({
  valoresIniciales,
  onGuardar,
  textoBoton = "Guardar",
}: ProyectoFormProps) {
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? "");
  const [ruta, setRuta] = useState(valoresIniciales?.ruta_carpeta ?? "");
  const [modelo, setModelo] = useState(valoresIniciales?.modelo_ia ?? MODELO_POR_DEFECTO);
  const [lenguajes, setLenguajes] = useState<NombreLenguaje[]>(valoresIniciales?.lenguajes ?? []);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function alternarLenguaje(lenguaje: NombreLenguaje): void {
    setLenguajes((actuales) =>
      actuales.includes(lenguaje)
        ? actuales.filter((l) => l !== lenguaje)
        : [...actuales, lenguaje]
    );
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!ruta.trim()) return setError("La ruta de la carpeta es obligatoria.");
    if (lenguajes.length === 0) return setError("Seleccione al menos un lenguaje.");

    setGuardando(true);
    try {
      await onGuardar({
        nombre: nombre.trim(),
        ruta_carpeta: ruta.trim(),
        modelo_ia: modelo.trim() || MODELO_POR_DEFECTO,
        lenguajes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      className="tarjeta"
      onSubmit={manejarEnvio}
      style={{ display: "grid", gap: "16px", maxWidth: "560px" }}
    >
      <label style={{ display: "grid", gap: "4px" }}>
        Nombre del proyecto
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} />
      </label>

      <label style={{ display: "grid", gap: "4px" }}>
        Ruta de la carpeta
        <input
          value={ruta}
          onChange={(e) => setRuta(e.target.value)}
          placeholder="C:\Proyectos\mi-api"
          maxLength={255}
        />
      </label>

      <label style={{ display: "grid", gap: "4px" }}>
        Modelo de Ollama
        <input value={modelo} onChange={(e) => setModelo(e.target.value)} maxLength={50} />
      </label>

      <fieldset style={{ display: "grid", gap: "4px" }}>
        <legend>Lenguajes</legend>
        {LENGUAJES.map((lenguaje) => (
          <label key={lenguaje}>
            <input
              type="checkbox"
              checked={lenguajes.includes(lenguaje)}
              onChange={() => alternarLenguaje(lenguaje)}
            />{" "}
            {lenguaje}
          </label>
        ))}
      </fieldset>

      {error && (
        <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
          {error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : textoBoton}
        </Button>
      </div>
    </form>
  );
}