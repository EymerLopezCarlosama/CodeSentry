import { useTema } from "../../hooks/useTema";
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

function IconoSol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function IconoLuna() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

export default function Header({ salud, sinConexion = false }: HeaderProps) {
  const { tema, alternar } = useTema();
  const etiquetaTema = tema === "oscuro" ? "Cambiar a tema claro" : "Cambiar a tema oscuro";

  return (
    <header className="app-header">
      <strong>CodeSentry</strong>
      <div className="header-acciones">
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
        <button
          type="button"
          className="btn-tema"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            alternar({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
          }}
          aria-label={etiquetaTema}
          title={etiquetaTema}
        >
          {tema === "oscuro" ? <IconoSol /> : <IconoLuna />}
        </button>
      </div>
    </header>
  );
}