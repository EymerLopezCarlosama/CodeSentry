import { useState } from "react"; // HU04
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal"; // HU04
import ProyectoForm from "../components/proyectos/ProyectoForm"; // HU03
import ProyectoList from "../components/proyectos/ProyectoList";
import { useProyectos } from "../hooks/useProyectos";
import type { DatosNuevoProyecto, Proyecto } from "../types"; // HU04 + HU03
import { useNavigate } from "react-router-dom";

export default function Proyectos() {
  const { proyectos, cargando, error, recargar, eliminar, actualizar } = useProyectos(); // HU04 + HU03
  const navigate = useNavigate();

  // HU04: proyecto pendiente de confirmar (null = modal cerrado)
  const [aEliminar, setAEliminar] = useState<Proyecto | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

  // HU03: proyecto que se está editando (null = no se edita ninguno)
  const [aEditar, setAEditar] = useState<Proyecto | null>(null);

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

  // HU03: si falla, el error lo muestra ProyectoForm (propaga el throw) y el form sigue abierto
  async function guardarEdicion(datos: DatosNuevoProyecto): Promise<void> {
    if (!aEditar) return;
    await actualizar(aEditar.id_proyecto, datos);
    setAEditar(null);
  }

  // HU03: mientras se edita, se muestra el formulario en lugar de la lista
  if (aEditar) {
    return (
      <section>
        <h1>Editar proyecto</h1>
        <ProyectoForm
          valoresIniciales={{
            nombre: aEditar.nombre,
            ruta_carpeta: aEditar.ruta_carpeta,
            modelo_ia: aEditar.modelo_ia,
            lenguajes: aEditar.lenguajes,
          }}
          onGuardar={guardarEdicion}
          textoBoton="Guardar cambios"
        />
        <p>
          <Button variante="secundario" onClick={() => setAEditar(null)}>
            Cancelar
          </Button>
        </p>
      </section>
    );
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
        <ProyectoList proyectos={proyectos} onEditar={setAEditar} onEliminar={setAEliminar} onRevisar={(proyecto) => navigate(`/revision?proyecto=${proyecto.id_proyecto}`)}/>
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