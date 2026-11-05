import { useState } from "react";
import Button from "../common/Button";
import { etiquetaSeveridad, formatearFecha } from "../../utils/format";
import type { EstadoChecklist, ItemChecklist, MotivoRechazo } from "../../types";

interface ChecklistItemProps {
  item: ItemChecklist;
  onMarcar: (idItem: number, estado: EstadoChecklist, motivo?: MotivoRechazo) => void;
  deshabilitado?: boolean;
}

const ETIQUETAS_ESTADO: Record<EstadoChecklist, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

const MOTIVOS: { valor: MotivoRechazo; texto: string }[] = [
  { valor: "falso_positivo", texto: "Falso positivo (el motor se equivocó)" },
  { valor: "no_aplica", texto: "No aplica (código de prueba o caso controlado)" },
  { valor: "riesgo_aceptado", texto: "Riesgo aceptado (lo revisamos y lo asumimos)" },
];

const ETIQUETA_MOTIVO: Record<MotivoRechazo, string> = {
  falso_positivo: "Falso positivo",
  no_aplica: "No aplica",
  riesgo_aceptado: "Riesgo aceptado",
};

export default function ChecklistItem({ item, onMarcar, deshabilitado = false }: ChecklistItemProps) {
  const [rechazando, setRechazando] = useState(false);
  const [motivo, setMotivo] = useState<MotivoRechazo>("falso_positivo");

  function confirmarRechazo(): void {
    setRechazando(false);
    onMarcar(item.id_checklist, "rechazada", motivo);
  }

  return (
    <div className="tarjeta" style={{ display: "grid", gap: "8px" }}>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <code>
          {item.ruta_relativa}:{item.linea_codigo}
        </code>
        <span className={`badge badge-${item.severidad}`}>{etiquetaSeveridad(item.severidad)}</span>
        <strong>{ETIQUETAS_ESTADO[item.estado]}</strong>
        {item.estado === "rechazada" && item.motivo && (
          <span className="chip">{ETIQUETA_MOTIVO[item.motivo]}</span>
        )}
        {item.fecha_marcado && <small>({formatearFecha(item.fecha_marcado)})</small>}
      </div>

      <p style={{ margin: 0 }}>{item.descripcion}</p>

      {item.estado === "pendiente" && rechazando ? (
        <div style={{ display: "grid", gap: "8px" }}>
          <label className="campo">
            ¿Por qué se rechaza?
            <select value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoRechazo)}>
              {MOTIVOS.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.texto}
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <Button variante="peligro" disabled={deshabilitado} onClick={confirmarRechazo}>
              Confirmar rechazo
            </Button>
            <Button variante="secundario" onClick={() => setRechazando(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px" }}>
          {item.estado === "pendiente" ? (
            <>
              <Button disabled={deshabilitado} onClick={() => onMarcar(item.id_checklist, "aceptada")}>
                Aceptar
              </Button>
              <Button variante="peligro" disabled={deshabilitado} onClick={() => setRechazando(true)}>
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
      )}
    </div>
  );
}