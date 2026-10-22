// PROMPT — components/resultados/ResultadoTable.tsx
//
// Tabla de hallazgos agrupados por archivo y ordenados por severidad (crítica primero): línea, tipo, descripción y SeveridadBadge. Props: archivos agrupados.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-07

import SeveridadBadge from "./SeveridadBadge";
import type { ArchivoConHallazgos, EstadoChecklist, TipoHallazgo } from "../../types";

interface ResultadoTableProps {
  archivos: ArchivoConHallazgos[];
}

const ETIQUETAS_TIPO: Record<TipoHallazgo, string> = {
  vulnerabilidad: "Vulnerabilidad",
  mala_practica: "Mala práctica",
  refactorizacion: "Refactorización",
};

const ETIQUETAS_CHECKLIST: Record<EstadoChecklist, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

export default function ResultadoTable({ archivos }: ResultadoTableProps) {
  if (archivos.length === 0) return null;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {archivos.map((archivo) => (
        <section key={archivo.ruta_relativa}>
          <h2 style={{ fontSize: "1.1rem" }}>
            {archivo.ruta_relativa}{" "}
            <span style={{ color: "var(--color-texto-suave)", fontWeight: "normal" }}>
              ({archivo.hallazgos.length}{" "}
              {archivo.hallazgos.length === 1 ? "hallazgo" : "hallazgos"})
            </span>
          </h2>

          <table className="tabla">
            <thead>
              <tr>
                <th>Línea</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Severidad</th>
                <th>Checklist</th>
              </tr>
            </thead>
            <tbody>
              {archivo.hallazgos.map((hallazgo) => (
                <tr key={hallazgo.id_resultado}>
                  <td>{hallazgo.linea_codigo}</td>
                  <td>{ETIQUETAS_TIPO[hallazgo.tipo] ?? hallazgo.tipo}</td>
                  <td>{hallazgo.descripcion}</td>
                  <td>
                    <SeveridadBadge severidad={hallazgo.severidad} />
                  </td>
                  <td>
                    {ETIQUETAS_CHECKLIST[hallazgo.estado_checklist] ?? hallazgo.estado_checklist}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}