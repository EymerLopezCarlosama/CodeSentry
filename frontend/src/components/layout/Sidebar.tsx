import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <nav className="app-sidebar">
      <NavLink to="/" end>
        Dashboard
      </NavLink>
      <NavLink to="/proyectos" end>
        Proyectos
      </NavLink>
      <NavLink to="/proyectos/nuevo">Nuevo proyecto</NavLink>
    </nav>
  );
}