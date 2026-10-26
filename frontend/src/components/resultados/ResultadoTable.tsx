// Hallazgos agrupados por archivo y ordenados por severidad (crítica primero), como tarjetas con
// visor de código. Componente de presentación.
// Referencia: HU-07

import HallazgoCard from "./HallazgoCard";
import type { ArchivoConHallazgos } from "../../types";

interface ResultadoTableProps {
  archivos: ArchivoConHallazgos[];
  idAnalisis: number;
  idResaltado?: number | null;
}

export default function ResultadoTable({ archivos, idAnalisis, idResaltado = null }: ResultadoTableProps) {
  if (archivos.length === 0) return null;

  return (
    <div className="resultados-lista">
      {archivos.map((archivo) => (
        <section key={archivo.ruta_relativa} className="archivo-grupo">
          <h2 className="archivo-cabecera">
            <span className="archivo-ruta">{archivo.ruta_relativa}</span>
            <span className="chip">
              {archivo.hallazgos.length} {archivo.hallazgos.length === 1 ? "hallazgo" : "hallazgos"}
            </span>
          </h2>
          <div className="hallazgos-lista">
            {archivo.hallazgos.map((hallazgo) => (
              <HallazgoCard
                key={hallazgo.id_resultado}
                hallazgo={hallazgo}
                idAnalisis={idAnalisis}
                resaltado={hallazgo.id_resultado === idResaltado}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}