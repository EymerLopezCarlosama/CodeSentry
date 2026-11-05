// Hallazgos agrupados por archivo (colapsables) y ordenados por severidad (crítica primero), como
// tarjetas con visor de código. Componente de presentación; solo guarda qué archivos están abiertos.
// Referencia: HU-07, HU-12

import { useEffect, useState } from "react";
import HallazgoCard from "./HallazgoCard";
import type { ArchivoConHallazgos, Severidad } from "../../types";
import PruebasArchivo from "./PruebasArchivo";
import { useReglas } from "../../hooks/useReglas";

interface ResultadoTableProps {
  archivos: ArchivoConHallazgos[];
  idAnalisis: number;
  idResaltado?: number | null;
  /** true cuando hay un filtro de severidad activo: todos los archivos arrancan abiertos. */
  filtrado?: boolean;
}

const ORDEN: Severidad[] = ["critica", "alta", "media", "baja"];
const TEXTO: Record<Severidad, string> = { critica: "Crítica", alta: "Alta", media: "Media", baja: "Baja" };

function severidadMaxima(archivo: ArchivoConHallazgos): Severidad {
  return ORDEN.find((s) => archivo.hallazgos.some((h) => h.severidad === s)) ?? "baja";
}

function contieneHallazgo(archivo: ArchivoConHallazgos, id: number | null): boolean {
  return id != null && archivo.hallazgos.some((h) => h.id_resultado === id);
}

export default function ResultadoTable({
  archivos,
  idAnalisis,
  idResaltado = null,
  filtrado = false,
}: ResultadoTableProps) {
  // 1. LLAMADA AL HOOK DENTRO DE LA FUNCIÓN DEL COMPONENTE
  const catalogo = useReglas();

  // Apertura inicial: con filtro, todos; sin filtro, solo los que tienen críticos o el hallazgo enlazado.
  const [abiertos, setAbiertos] = useState<Set<string>>(
    () =>
      new Set(
        archivos
          .filter(
            (a) =>
              filtrado ||
              a.hallazgos.some((h) => h.severidad === "critica") ||
              contieneHallazgo(a, idResaltado)
          )
          .map((a) => a.ruta_relativa)
      )
  );

  // Si llega un enlace directo a un hallazgo (también al cambiar el # estando en la página), abre su archivo.
  useEffect(() => {
    if (idResaltado == null) return;
    const archivo = archivos.find((a) => contieneHallazgo(a, idResaltado));
    if (!archivo) return;

    setAbiertos((previo) => {
      const nuevo = new Set(previo);
      nuevo.add(archivo.ruta_relativa);
      return nuevo;
    });
  }, [idResaltado, archivos]);

  if (archivos.length === 0) return null;

  const alternar = (ruta: string) =>
    setAbiertos((previo) => {
      const nuevo = new Set(previo);
      if (nuevo.has(ruta)) nuevo.delete(ruta);
      else nuevo.add(ruta);
      return nuevo;
    });

  const todosAbiertos = archivos.every((a) => abiertos.has(a.ruta_relativa));

  return (
    <div className="resultados-lista">
      <div className="resultados-barra">
        <span className="resultados-resumen">
          {archivos.length} {archivos.length === 1 ? "archivo" : "archivos"}
        </span>
        <button
          type="button"
          className="enlace-boton"
          onClick={() => setAbiertos(new Set(archivos.map((a) => a.ruta_relativa)))}
          disabled={todosAbiertos}
        >
          Expandir todo
        </button>
        <button
          type="button"
          className="enlace-boton"
          onClick={() => setAbiertos(new Set())}
          disabled={abiertos.size === 0}
        >
          Colapsar todo
        </button>
      </div>

      {archivos.map((archivo) => {
        const abierto = abiertos.has(archivo.ruta_relativa);
        const maxima = severidadMaxima(archivo);
        const idLista = `hallazgos-${archivo.ruta_relativa}`;
        return (
          <section key={archivo.ruta_relativa} className={`archivo-grupo${abierto ? " abierto" : ""}`}>
            <h2 className="archivo-cabecera">
              <button
                type="button"
                className="archivo-toggle"
                onClick={() => alternar(archivo.ruta_relativa)}
                aria-expanded={abierto}
                aria-controls={idLista}
              >
                <span className="archivo-flecha" aria-hidden="true">
                  {abierto ? "▾" : "▸"}
                </span>
                <span className="archivo-ruta">{archivo.ruta_relativa}</span>
                <span className={`chip sev-${maxima}`}>Máx.: {TEXTO[maxima]}</span>
                <span className="chip">
                  {archivo.hallazgos.length} {archivo.hallazgos.length === 1 ? "hallazgo" : "hallazgos"}
                </span>
              </button>
            </h2>

            {/* HU-12: Botón y panel de pruebas fuera del acordeón para que no se destruya al colapsar */}
            <div className="archivo-acciones">
              <PruebasArchivo idArchivo={archivo.id_archivo} rutaRelativa={archivo.ruta_relativa} />
            </div>

            {abierto && (
              <div className="hallazgos-lista" id={idLista}>
                {archivo.hallazgos.map((hallazgo) => (
                  <HallazgoCard
                    key={hallazgo.id_resultado}
                    hallazgo={hallazgo}
                    regla={hallazgo.regla ? catalogo.get(hallazgo.regla) : undefined}
                    idAnalisis={idAnalisis}
                    resaltado={hallazgo.id_resultado === idResaltado}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}