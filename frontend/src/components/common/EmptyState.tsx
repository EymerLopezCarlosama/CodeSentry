import { useNavigate } from "react-router-dom";
import Button from "./Button";

interface EmptyStateProps {
  mensaje?: string;
}

export default function EmptyState({
  mensaje = "Aún no hay proyectos registrados.",
}: EmptyStateProps) {
  const navigate = useNavigate();

  return (
    <div className="empty-state tarjeta">
      <div className="empty-icono" aria-hidden="true">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M12 11v5M9.5 13.5h5" />
        </svg>
      </div>
      <h3>Todo empieza con un proyecto</h3>
      <p>{mensaje}</p>
      <Button onClick={() => navigate("/proyectos/nuevo")}>Agregar primer proyecto</Button>
    </div>
  );
}