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
      <p>{mensaje}</p>
      <Button onClick={() => navigate("/proyectos/nuevo")}>Agregar primer proyecto</Button>
    </div>
  );
}