// Tabla del historial de análisis: proyecto, alcance, fecha, modelo, estado, hallazgos y accesos
// directos a Resultados / Checklist / Reporte. Componente de presentación (sin llamadas a la API).
// Referencia: HU-07, HU-10

import { useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { etiquetaEstadoAnalisis, formatearFecha } from "../../utils/format";
import type { AnalisisResumen } from "../../types";

interface AnalisisTableProps {
  analisis: AnalisisResumen[];
  compacta?: boolean; // en el dashboard: solo "Ver resultados"
}

export default function AnalisisTable({ analisis, compacta = false }: AnalisisTableProps) {
  const navigate = useNavigate();

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>#</th>
          <th>Proyecto</th>
          <th>Alcance</th>
          <th>Fecha</th>
          {!compacta && <th>Modelo</th>}
          <th>Estado</th>
          <th>Hallazgos</th>
          <th>Graves</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {analisis.map((a) => {
          const terminado = a.estado === "completado";
          return (
            <tr key={a.id_analisis}>
              <td>{a.id_analisis}</td>
              <td>{a.proyecto}</td>
              <td>{a.tipo_objetivo === "archivo" ? (a.ruta_relativa ?? "Archivo") : "Carpeta completa"}</td>
              <td>{formatearFecha(a.fecha_analisis)}</td>
              {!compacta && <td>{a.modelo_ia_usado}</td>}
              <td>
                <span className={`badge badge-estado-${a.estado}`}>
                  {etiquetaEstadoAnalisis(a.estado)}
                </span>
              </td>
              <td>{terminado ? a.hallazgos : "—"}</td>
              <td>{terminado ? a.graves : "—"}</td>
              <td>
                <div className="acciones-fila">
                  <Button onClick={() => navigate(`/analisis/${a.id_analisis}/resultados`)}>
                    Ver resultados
                  </Button>
                  {!compacta && terminado && (
                    <>
                      <Button
                        variante="secundario"
                        onClick={() => navigate(`/analisis/${a.id_analisis}/checklist`)}
                      >
                        Checklist
                      </Button>
                      <Button
                        variante="secundario"
                        onClick={() => navigate(`/analisis/${a.id_analisis}/reporte`)}
                      >
                        Reporte
                      </Button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
