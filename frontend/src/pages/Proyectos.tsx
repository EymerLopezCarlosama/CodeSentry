import Button from "../components/common/Button";
import EmptyState from "../components/common/EmptyState";
import Loader from "../components/common/Loader";
import ProyectoList from "../components/proyectos/ProyectoList";
import { useProyectos } from "../hooks/useProyectos";

export default function Proyectos() {
  const { proyectos, cargando, error, recargar } = useProyectos();

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

      {!cargando && !error && proyectos.length > 0 && <ProyectoList proyectos={proyectos} />}
    </section>
  );
}