// PROMPT — components/proyectos/ProyectoForm.tsx
//
// Formulario para crear/editar un proyecto: nombre, ruta de la carpeta, selector de modelo de Ollama (GET /modelos) y lenguajes (JavaScript/TypeScript/Python). Muestra los errores del backend (RUTA_INEXISTENTE, RUTA_DUPLICADA). Props: valores iniciales, onGuardar.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-01, HU-03

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Button from "../common/Button";
import InstalarModeloModal from "./InstalarModeloModal";
import ResumenEscaneo from "./ResumenEscaneo";
import type { DatosNuevoProyecto, NombreLenguaje, ResultadoEscaneo } from "../../types";
import * as sistemaService from "../../services/sistema.service";
import * as modelosService from "../../services/modelos.service";
import * as proyectosService from "../../services/proyectos.service";
import { ErrorApi } from "../../services/api";

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
  const [modelo, setModelo] = useState(valoresIniciales?.modelo_ia ?? "");
  const [lenguajes, setLenguajes] = useState<NombreLenguaje[]>(valoresIniciales?.lenguajes ?? []);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [examinando, setExaminando] = useState(false);
    const [escaneo, setEscaneo] = useState<ResultadoEscaneo | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [errorEscaneo, setErrorEscaneo] = useState<string | null>(null);
  // Evita re-escanear la misma ruta (por ejemplo al abrir el formulario de edición)
  const ultimaRutaEscaneada = useRef((valoresIniciales?.ruta_carpeta ?? "").trim());
  // Para ignorar respuestas viejas si el usuario cambia de carpeta mientras se escanea
  const idEscaneo = useRef(0);

  const [instalados, setInstalados] = useState<string[]>([]);
  const [permitidos, setPermitidos] = useState<string[]>([]);
  const [cargandoModelos, setCargandoModelos] = useState(true);
  const [errorModelos, setErrorModelos] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargarModelos = useCallback(async (preferido?: string): Promise<void> => {
    setCargandoModelos(true);
    setErrorModelos(null);
    try {
      const datos = await modelosService.listar();
      setInstalados(datos.instalados);
      setPermitidos(datos.permitidos);

      if (preferido) {
        setModelo(preferido);
      } else if (datos.instalados.length >= 1) {
        setModelo((actual) => actual || datos.instalados[0]);
      }
    } catch (err) {
      if (
        err instanceof ErrorApi &&
        (err.codigo === "OLLAMA_NO_DISPONIBLE" || err.codigo === "ANALYZER_NO_DISPONIBLE")
      ) {
        setErrorModelos(
          "Ollama no está disponible. Enciéndelo (y el analyzer) para elegir un modelo."
        );
      } else {
        setErrorModelos(err instanceof Error ? err.message : "No se pudieron cargar los modelos.");
      }
    } finally {
      setCargandoModelos(false);
    }
  }, []);

  useEffect(() => {
    void cargarModelos();
  }, [cargarModelos]);

  function alternarLenguaje(lenguaje: NombreLenguaje): void {
    setLenguajes((actuales) =>
      actuales.includes(lenguaje)
        ? actuales.filter((l) => l !== lenguaje)
        : [...actuales, lenguaje]
    );
  }

    async function escanearCarpeta(rutaAEscanear: string): Promise<void> {
    const carpeta = rutaAEscanear.trim();
    if (carpeta === ultimaRutaEscaneada.current) return;
    ultimaRutaEscaneada.current = carpeta;
    const id = ++idEscaneo.current;

    setEscaneo(null);
    setErrorEscaneo(null);
    if (!carpeta) {
      setEscaneando(false);
      return;
    }

    setEscaneando(true);
    try {
      const resultado = await proyectosService.escanear(carpeta);
      if (id !== idEscaneo.current) return; // llegó una respuesta vieja
      setEscaneo(resultado);
      // Marca solo los lenguajes soportados que se encontraron
      setLenguajes(LENGUAJES.filter((l) => l in resultado.soportados));
    } catch (err) {
      if (id !== idEscaneo.current) return;
      setErrorEscaneo(err instanceof Error ? err.message : "No se pudo escanear la carpeta.");
    } finally {
      if (id === idEscaneo.current) setEscaneando(false);
    }
  }

  async function examinar(): Promise<void> {
    setError(null);
    setExaminando(true);
    try {
      const carpeta = await sistemaService.seleccionarCarpeta();
      if (carpeta) {
        setRuta(carpeta);
        void escanearCarpeta(carpeta);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setExaminando(false);
    }
  }

  async function manejarEnvio(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    setError(null);

    if (!nombre.trim()) return setError("El nombre es obligatorio.");
    if (!ruta.trim()) return setError("La ruta de la carpeta es obligatoria.");
        if (!ruta.trim()) return setError("La ruta de la carpeta es obligatoria.");
    if (escaneando) return setError("Espera a que termine el escaneo de la carpeta.");
    if (escaneo && Object.keys(escaneo.soportados).length === 0) {
      return setError("La carpeta no tiene lenguajes que pueda analizar (JavaScript, TypeScript o Python).");
    }
    if (lenguajes.length === 0) return setError("Seleccione al menos un lenguaje.");
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

  const opciones =
    modelo && !modelosService.estaInstalado(modelo, instalados)
      ? [modelo, ...instalados]
      : instalados;

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

      <div style={{ display: "grid", gap: "4px" }}>
        <label htmlFor="ruta-carpeta">Ruta de la carpeta</label>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            id="ruta-carpeta"
            style={{ flex: 1 }}
            value={ruta}
            onChange={(e) => setRuta(e.target.value)}
            onBlur={() => void escanearCarpeta(ruta)}
            placeholder="C:\Proyectos\mi-api"
            maxLength={255}
          />
          <Button variante="secundario" onClick={() => void examinar()} disabled={examinando}>
            📁 {examinando ? "Esperando..." : "Examinar"}
          </Button>
        </div>
        <ResumenEscaneo cargando={escaneando} resultado={escaneo} error={errorEscaneo} />
      </div>

      <div style={{ display: "grid", gap: "4px" }}>
        <label htmlFor="modelo-ollama">Modelo de Ollama</label>

        {cargandoModelos && <small>Buscando modelos instalados...</small>}

        {!cargandoModelos && errorModelos && (
          <>
            <p role="alert" style={{ color: "var(--color-peligro)", margin: 0 }}>
              {errorModelos}
            </p>
            <div>
              <Button variante="secundario" onClick={() => void cargarModelos()}>
                Reintentar
              </Button>
            </div>
            {modelo && <small>Se conserva el modelo actual: {modelo}</small>}
          </>
        )}

        {!cargandoModelos && !errorModelos && instalados.length === 0 && (
          <>
            <small>No hay modelos instalados.</small>
            <div>
              <Button variante="secundario" onClick={() => setModalAbierto(true)}>
                Instalar un modelo
              </Button>
            </div>
          </>
        )}

        {!cargandoModelos && !errorModelos && instalados.length === 1 && opciones.length === 1 && (
          <input id="modelo-ollama" value={instalados[0]} readOnly />
        )}

        {!cargandoModelos && !errorModelos && opciones.length > 1 && (
          <select id="modelo-ollama" value={modelo} onChange={(e) => setModelo(e.target.value)}>
            {opciones.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </div>

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

      <InstalarModeloModal
        abierto={modalAbierto}
        modelos={permitidos}
        onCerrar={() => setModalAbierto(false)}
        onInstalado={(m) => {
          setModalAbierto(false);
          void cargarModelos(m);
        }}
      />
    </form>
  );
}