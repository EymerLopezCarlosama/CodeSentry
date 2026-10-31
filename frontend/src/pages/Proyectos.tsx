import { useState } from "react"; // HU04
import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import Modal from "../components/common/Modal"; // HU04
import EncabezadoPagina from "../components/layout/EncabezadoPagina";
import ProyectoForm from "../components/proyectos/ProyectoForm"; // HU03
import ProyectoList from "../components/proyectos/ProyectoList";
import { useProyectos } from "../hooks/useProyectos";
import type { DatosNuevoProyecto, Proyecto } from "../types"; // HU04 + HU03

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
        <EncabezadoPagina titulo="Editar proyecto" descripcion={aEditar.nombre}>
          <Button variante="secundario" onClick={() => setAEditar(null)}>
            Cancelar
          </Button>
        </EncabezadoPagina>
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
      </section>
    );
  }

  return (
    <section>
      <EncabezadoPagina
        titulo="Proyectos"
        descripcion="Las carpetas de código que CodeSentry revisa en tu equipo."
      >
        <Button onClick={() => navigate("/proyectos/nuevo")}>Nuevo proyecto</Button>
      </EncabezadoPagina>

      {cargando && <Loader />}

      {!cargando && error && (
        <div className="tarjeta">
          <p className="mensaje-error">{error}</p>
          <Button onClick={() => void recargar()}>Reintentar</Button>
        </div>
      )}

      {!cargando && !error && proyectos.length === 0 && <EmptyState />}

      {!cargando && !error && proyectos.length > 0 && (
        <ProyectoList
          proyectos={proyectos}
          onEditar={setAEditar}
          onEliminar={setAEliminar}
          onRevisar={(proyecto) => navigate(`/revision?proyecto=${proyecto.id_proyecto}`)}
        />
      )}

      {errorEliminar && (
        <div className="tarjeta" role="alert" style={{ marginTop: "var(--espacio-3)" }}>
          <p className="mensaje-error">{errorEliminar}</p>
        </div>
      )}

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