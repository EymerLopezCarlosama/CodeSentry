import Button from "../common/Button";
import { etiquetaSeveridad, formatearFecha } from "../../utils/format";
import type { EstadoChecklist, ItemChecklist } from "../../types";

interface ChecklistItemProps {
  item: ItemChecklist;
  onMarcar: (idItem: number, estado: EstadoChecklist) => void;
  deshabilitado?: boolean;
}

const ETIQUETAS_ESTADO: Record<EstadoChecklist, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

export default function ChecklistItem({ item, onMarcar, deshabilitado = false }: ChecklistItemProps) {
  return (
    <div className="tarjeta" style={{ display: "grid", gap: "8px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <code>
          {item.ruta_relativa}:{item.linea_codigo}
        </code>
        <span className={`badge badge-${item.severidad}`}>{etiquetaSeveridad(item.severidad)}</span>
        <strong>{ETIQUETAS_ESTADO[item.estado]}</strong>
        {item.fecha_marcado && <small>({formatearFecha(item.fecha_marcado)})</small>}
      </div>

      <p style={{ margin: 0 }}>{item.descripcion}</p>

      <div style={{ display: "flex", gap: "8px" }}>
        {item.estado === "pendiente" ? (
          <>
            <Button disabled={deshabilitado} onClick={() => onMarcar(item.id_checklist, "aceptada")}>
              Aceptar
            </Button>
            <Button
              variante="peligro"
              disabled={deshabilitado}
              onClick={() => onMarcar(item.id_checklist, "rechazada")}
            >
              Rechazar
            </Button>
          </>
        ) : (
          <Button
            variante="secundario"
            disabled={deshabilitado}
            onClick={() => onMarcar(item.id_checklist, "pendiente")}
          >
            Volver a pendiente
          </Button>
        )}
      </div>
    </div>
  );
}