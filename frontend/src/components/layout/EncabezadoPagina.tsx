import type { ReactNode } from "react";

interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  children?: ReactNode; // acciones (botones) a la derecha
}

export default function EncabezadoPagina({ titulo, descripcion, children }: EncabezadoPaginaProps) {
  return (
    <div className="pagina-encabezado">
      <div>
        <h1>{titulo}</h1>
        {descripcion && <p className="texto-suave">{descripcion}</p>}
      </div>
      {children && <div className="pagina-acciones">{children}</div>}
    </div>
  );
}