import { NavLink } from "react-router-dom";
import { useEfectos } from "../../hooks/useEfectos";
import { IconoCarpeta, IconoDashboard, IconoHistorial, IconoNuevo } from "./Iconos";
import LogoEscudo from "./LogoEscudo";

const ENLACES = [
  { to: "/", etiqueta: "Dashboard", icono: <IconoDashboard />, end: true },
  { to: "/proyectos", etiqueta: "Proyectos", icono: <IconoCarpeta />, end: true },
  { to: "/proyectos/nuevo", etiqueta: "Nuevo proyecto", icono: <IconoNuevo />, end: false },
  { to: "/analisis", etiqueta: "Historial de análisis", icono: <IconoHistorial />, end: true },
];

export default function Sidebar() {
  const { efectos, alternar } = useEfectos();
  const activos = efectos === "alto";

  return (
    <nav className="app-sidebar" aria-label="Navegación principal">
      <div className="sidebar-marca">
        <LogoEscudo />
        <span>CodeSentry</span>
      </div>

      <div className="sidebar-nav">
        {ENLACES.map((enlace) => (
          <NavLink key={enlace.to} to={enlace.to} end={enlace.end}>
            {enlace.icono}
            <span>{enlace.etiqueta}</span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-pie">
        <span>Efectos visuales</span>
        <button
          type="button"
          role="switch"
          aria-checked={activos}
          className="interruptor"
          onClick={alternar}
          title={activos ? "Efectos altos: pulsa para bajarlos" : "Efectos bajos: pulsa para subirlos"}
        >
          <span className="interruptor-bola" />
        </button>
      </div>
    </nav>
  );
}