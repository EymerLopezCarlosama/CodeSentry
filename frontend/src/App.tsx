import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import { useUsuario } from "./hooks/useUsuario";
import { api } from "./services/api";
import type { Salud } from "./types";

const INTERVALO_SALUD_MS = 30000;
const URL_LAUNCHER = "http://localhost:4000";

export default function App() {
  const { nombre } = useUsuario();
  const [salud, setSalud] = useState<Salud | null>(null);
  const [sinConexion, setSinConexion] = useState(false);

  useEffect(() => {
    let activo = true;

    async function consultar(): Promise<void> {
      try {
        const datos = await api<Salud>("/salud");
        if (!activo) return;
        setSalud(datos);
        setSinConexion(false);
      } catch {
        if (activo) setSinConexion(true);
      }
    }

    void consultar();
    const id = setInterval(consultar, INTERVALO_SALUD_MS);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, []);

  if (!nombre) {
    return (
      <main style={{ display: "grid", placeItems: "center", minHeight: "100vh", padding: "1rem" }}>
        <div className="tarjeta" style={{ maxWidth: 440, textAlign: "center" }}>
          <h2>Falta configurar CodeSentry</h2>
          <p>Abre CodeSentry desde el Centro de arranque: ahí pones tu nombre y se enciende todo.</p>
          <a className="btn btn-primario" href={URL_LAUNCHER}>Ir al Centro de arranque</a>
          <p className="texto-suave">Si no abre, ejecuta CodeSentry.bat.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="app">
      <Header salud={salud} sinConexion={sinConexion} />
      <Sidebar />
      <main className="app-contenido">
        <Outlet />
      </main>
    </div>
  );
}