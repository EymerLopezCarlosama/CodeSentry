import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/common/Button";
import Loader from "../components/common/Loader";
import ChecklistItem from "../components/checklist/ChecklistItem";
import * as checklistService from "../services/checklist.service";
import type { EstadoChecklist, ItemChecklist } from "../types";

export default function Checklist() {
  const { id } = useParams();
  const idAnalisis = Number(id);

  const [items, setItems] = useState<ItemChecklist[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorMarcar, setErrorMarcar] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<number | null>(null);

  const cargar = useCallback(async (): Promise<void> => {
    setCargando(true);
    setError(null);
    try {
      setItems(await checklistService.listar(idAnalisis));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setCargando(false);
    }
  }, [idAnalisis]);

  useEffect(() => {
    if (Number.isInteger(idAnalisis) && idAnalisis > 0) void cargar();
    else {
      setError("El identificador del análisis no es válido.");
      setCargando(false);
    }
  }, [cargar, idAnalisis]);

  async function marcar(idItem: number, estado: EstadoChecklist): Promise<void> {
    setErrorMarcar(null);
    setGuardando(idItem);
    try {
      const actualizado = await checklistService.marcar(idItem, estado);
      // Se reemplaza solo el item cambiado: sin recargar toda la lista
      setItems((actuales) =>
        actuales.map((i) => (i.id_checklist === idItem ? actualizado : i))
      );
    } catch (err) {
      setErrorMarcar(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setGuardando(null);
    }
  }

  const resueltas = items.filter((i) => i.estado !== "pendiente").length;

  return (
    <section>
      <h1>Checklist de sugerencias</h1>

      {cargando && <Loader />}

      {!cargando && error && (
        <div className="tarjeta">
          <p>{error}</p>
          <Button onClick={() => void cargar()}>Reintentar</Button>
        </div>
      )}

      {!cargando && !error && items.length === 0 && (
        <div className="tarjeta">
          <p>Este análisis no tiene sugerencias en el checklist.</p>
        </div>
      )}

      {!cargando && !error && items.length > 0 && (
        <>
          <p>
            Resueltas: <strong>{resueltas}</strong> de {items.length}
          </p>
          {errorMarcar && (
            <p role="alert" style={{ color: "var(--color-peligro)" }}>
              {errorMarcar}
            </p>
          )}
          <div style={{ display: "grid", gap: "12px" }}>
            {items.map((item) => (
              <ChecklistItem
                key={item.id_checklist}
                item={item}
                onMarcar={(idItem, estado) => void marcar(idItem, estado)}
                deshabilitado={guardando === item.id_checklist}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}