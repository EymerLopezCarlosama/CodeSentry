import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsuario } from "../hooks/useUsuario";
import { obtenerSalud, type Salud } from "../services/salud.service";
import { saludoPorHora } from "../utils/format";
import "./Arranque.css";

const REQUISITOS = [
  { clave: "backend", titulo: "Servidor de CodeSentry", detalle: "API local, puerto 3001", obligatorio: true },
  { clave: "base_datos", titulo: "Base de datos", detalle: "MySQL en Docker, puerto 3307", obligatorio: true },
  { clave: "analyzer", titulo: "Motor de análisis", detalle: "Reglas estáticas en Python", obligatorio: true },
  { clave: "ollama", titulo: "IA local (Ollama)", detalle: "Solo para explicar hallazgos", obligatorio: false },
] as const;

const TODO_ERROR: Salud = { backend: "error", base_datos: "error", analyzer: "error", ollama: "error" };
const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));
const PASOS = ["Bienvenida", "Requisitos", "Listo"];

export default function Arranque() {
  const navigate = useNavigate();
  const { nombre, guardar } = useUsuario();
  const [paso, setPaso] = useState<number>(nombre ? 1 : 0);
  const [borrador, setBorrador] = useState("");
  const [salud, setSalud] = useState<Salud | null>(null);
  const [verificando, setVerificando] = useState(false);

  const verificar = useCallback(async () => {
    setVerificando(true);
    setSalud(null);
    try {
      const [s] = await Promise.all([obtenerSalud(), pausa(900)]);
      setSalud(s);
    } catch {
      await pausa(600);
      setSalud(TODO_ERROR);
    } finally {
      setVerificando(false);
    }
  }, []);

  useEffect(() => {
    if (paso === 1) verificar();
  }, [paso, verificar]);

  const obligatoriosOk =
    !!salud && REQUISITOS.filter((r) => r.obligatorio).every((r) => salud[r.clave] === "ok");

  function enviarNombre(e: React.FormEvent) {
    e.preventDefault();
    if (!borrador.trim()) return;
    guardar(borrador);
    setPaso(1);
  }

  return (
    <div className="arranque">
      <div className="arranque-brillo" />
      <div className="arranque-card">
        <svg className="arranque-logo" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M24 4 6 11v12c0 11 7.5 18.5 18 21 10.5-2.5 18-10 18-21V11L24 4z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <path d="m16 24 6 6 11-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <ol className="arranque-pasos">
          {PASOS.map((p, i) => (
            <li key={p} className={i === paso ? "activo" : i < paso ? "hecho" : ""}>
              <span>{i < paso ? "✓" : i + 1}</span>
              {p}
            </li>
          ))}
        </ol>

        {paso === 0 && (
          <form className="arranque-seccion" onSubmit={enviarNombre}>
            <h1>Bienvenido a CodeSentry</h1>
            <p>Análisis de calidad de código, 100 % local. Tu código nunca sale de este equipo.</p>
            <label htmlFor="nombre">¿Cómo te llamas?</label>
            <input
              id="nombre"
              value={borrador}
              onChange={(e) => setBorrador(e.target.value)}
              placeholder="Tu nombre"
              maxLength={40}
              autoFocus
            />
            <button className="arranque-boton" type="submit" disabled={!borrador.trim()}>
              Continuar
            </button>
          </form>
        )}

        {paso === 1 && (
          <div className="arranque-seccion">
            <h1>Verificando requisitos</h1>
            <p>Comprobando que todo lo necesario esté encendido.</p>
            <ul className="arranque-lista">
              {REQUISITOS.map((r, i) => {
                const estado = verificando || !salud ? "cargando" : salud[r.clave] === "ok" ? "ok" : r.obligatorio ? "error" : "aviso";
                return (
                  <li key={r.clave} className={estado} style={{ animationDelay: `${i * 90}ms` }}>
                    <span className="arranque-icono">
                      {estado === "cargando" ? <i className="arranque-spinner" /> : estado === "ok" ? "✓" : estado === "error" ? "✕" : "!"}
                    </span>
                    <div>
                      <strong>{r.titulo}</strong>
                      <small>
                        {estado === "aviso" ? "No detectado: el análisis funciona, sin explicaciones de IA" : r.detalle}
                        {!r.obligatorio && estado !== "aviso" ? " · opcional" : ""}
                      </small>
                    </div>
                  </li>
                );
              })}
            </ul>
            {salud && !obligatoriosOk && (
              <p className="arranque-ayuda">
                Falta algo obligatorio. Enciende Docker (<code>docker compose up -d</code>), el backend y el analyzer, y reintenta.
              </p>
            )}
            <div className="arranque-acciones">
              <button className="arranque-boton secundario" onClick={verificar} disabled={verificando}>
                Reintentar
              </button>
              <button className="arranque-boton" onClick={() => setPaso(2)} disabled={!obligatoriosOk}>
                Continuar
              </button>
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="arranque-seccion">
            <h1>
              {saludoPorHora()}, {nombre}
            </h1>
            <p>Todo está listo. Registra tu primer proyecto y deja que CodeSentry vigile tu código.</p>
            <button className="arranque-boton grande" onClick={() => navigate("/")}>
              Entrar al dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}