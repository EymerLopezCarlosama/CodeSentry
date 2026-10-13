import type { Salud } from "../../types";

interface HeaderProps {
  salud: Salud | null;
  sinConexion?: boolean;
}

const ETIQUETAS: Record<string, string> = {
  backend: "Backend",
  base_datos: "Base de datos",
  analyzer: "Analyzer",
  ollama: "Ollama",
};

export default function Header({ salud, sinConexion = false }: HeaderProps) {
  return (
    <header className="app-header">
      <strong>CodeSentry</strong>
      <div className="estado-plataforma">
        {sinConexion ? (
          <span className="estado-item">
            <span className="estado-punto error" />
            Sin conexión con el backend
          </span>
        ) : salud === null ? (
          <span className="estado-item">Verificando...</span>
        ) : (
          Object.entries(salud).map(([clave, valor]) => (
            <span key={clave} className="estado-item">
              <span className={`estado-punto ${valor === "ok" ? "ok" : "error"}`} />
              {ETIQUETAS[clave] ?? clave}
            </span>
          ))
        )}
      </div>
    </header>
  );
}