import { useState } from "react"; // HU04
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal"; // HU04
import ProyectoList from "../components/proyectos/ProyectoList";
import { useProyectos } from "../hooks/useProyectos";
import type { Proyecto } from "../types"; // HU04

export default function Proyectos() {
  const { proyectos, cargando, error, recargar, eliminar } = useProyectos(); // HU04: + eliminar

  // HU04: proyecto pendiente de confirmar (null = modal cerrado)
  const [aEliminar, setAEliminar] = useState<Proyecto | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  // HU04: se ejecuta solo si el usuario confirma en el modal
  async function confirmarEliminar(): Promise<void> {
    if (!aEliminar) return;
    try {
      await eliminar(aEliminar.id_proyecto);
      setErrorEliminar(null);
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : "No se pudo eliminar el proyecto.");
    } finally {
      setAEliminar(null);
    }
  }

  return (
    <section>
      <h1>Proyectos</h1>

      {cargando && <Loader />}

      {!cargando && error && (
        <div className="tarjeta">
          <p>{error}</p>
          <Button onClick={() => void recargar()}>Reintentar</Button>
        </div>
      )}

      {!cargando && !error && proyectos.length === 0 && <EmptyState />}

      {!cargando && !error && proyectos.length > 0 && (
        <ProyectoList proyectos={proyectos} onEliminar={setAEliminar} />
      )}

      {errorEliminar && <p role="alert">{errorEliminar}</p>}

      <Modal
        abierto={aEliminar !== null}
        titulo="Eliminar proyecto"
        onCerrar={() => setAEliminar(null)}
        onConfirmar={() => void confirmarEliminar()}
        textoConfirmar="Eliminar"
        varianteConfirmar="peligro"
      >
        <p>
          ¿Eliminar <strong>{aEliminar?.nombre}</strong>? Se borra el registro de CodeSentry, pero
          los archivos de tu carpeta no se tocan.
        </p>
      </Modal>
    </section>
  );
}