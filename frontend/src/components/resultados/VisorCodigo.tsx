import { useEffect, useRef } from "react";
import type { FragmentoCodigo, Severidad } from "../../types";

interface VisorCodigoProps {
  fragmento: FragmentoCodigo;
  severidad: Severidad;
}

export default function VisorCodigo({ fragmento, severidad }: VisorCodigoProps) {
  const caja = useRef<HTMLDivElement>(null);

  // Deja la línea marcada en el centro del visor cuando hay scroll interno
  useEffect(() => {
    const contenedor = caja.current;
    const marcada = contenedor?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!contenedor || !marcada) return;
    contenedor.scrollTop = Math.max(
      0,
      marcada.offsetTop - contenedor.clientHeight / 2 + marcada.offsetHeight / 2
    );
  }, [fragmento]);

  return (
    <div className={`visor sev-${severidad}`}>
      <div className="visor-cabecera">
        <span className="visor-archivo" title={fragmento.ruta_relativa}>
          {fragmento.ruta_relativa}
        </span>
        <span className="visor-posicion">
          línea {fragmento.linea} de {fragmento.total_lineas}
        </span>
      </div>

      {fragmento.linea_fuera_de_rango && (
        <p className="visor-aviso" role="alert">
          El archivo cambió desde el análisis: la línea {fragmento.linea} ya no existe (ahora tiene{" "}
          {fragmento.total_lineas}). Se muestra el final del archivo.
        </p>
      )}

      <div
        ref={caja}
        className="visor-codigo"
        role="region"
        aria-label={`Código de ${fragmento.ruta_relativa}`}
        tabIndex={0}
      >
        <div className="visor-lineas">
          {fragmento.lineas.map((linea) => {
            const marcada = linea.numero === fragmento.linea;
            return (
              <div
                key={linea.numero}
                className={`visor-linea${marcada ? " resaltada" : ""}`}
                aria-current={marcada ? "true" : undefined}
              >
                <span className="visor-num" aria-hidden="true">
                  {linea.numero}
                </span>
                <code className="visor-texto">{linea.texto === "" ? " " : linea.texto}</code>
              </div>
            );
          })}
        </div>
      </div>

      <p className="visor-nota">
        Se muestra el archivo tal como está ahora: si lo editaste después del análisis, la línea marcada
        puede no coincidir.
      </p>
    </div>
  );
}