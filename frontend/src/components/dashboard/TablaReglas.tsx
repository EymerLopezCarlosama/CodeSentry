import { useReglas } from "../../hooks/useReglas";
import type { EstadisticaRegla } from "../../types";

interface TablaReglasProps {
  estadisticas: EstadisticaRegla[];
}

export default function TablaReglas({ estadisticas }: TablaReglasProps) {
  const catalogo = useReglas();

  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>Regla</th>
            <th>Marcadas</th>
            <th>Aceptadas</th>
            <th>Falsos positivos</th>
            <th>Precisión estimada</th>
            <th>Sugerencia</th>
          </tr>
        </thead>
        <tbody>
          {estadisticas.map((e) => {
            const cwe = catalogo.get(e.regla)?.cwe;
            const precision = e.precision_estimada;
            return (
              <tr key={e.regla}>
                <td>
                  <code>{e.regla}</code> {cwe && <span className="chip">{cwe}</span>}
                </td>
                <td>
                  {e.aceptadas + e.rechazadas} de {e.total}
                </td>
                <td>{e.aceptadas}</td>
                <td>{e.falsos_positivos}</td>
                <td>
                  {precision === null ? (
                    "—"
                  ) : (
                    <>
                      <span className={`barra-precision${precision < 50 ? " baja" : ""}`}>
                        <span style={{ width: `${precision}%` }} />
                      </span>
                      {precision} %
                      {!e.muestra_suficiente && <small className="texto-suave"> · muestra baja</small>}
                    </>
                  )}
                </td>
                <td>{e.sugerencia ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}