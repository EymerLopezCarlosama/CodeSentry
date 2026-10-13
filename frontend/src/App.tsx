import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import { api } from "./services/api";
import type { Salud } from "./types";

const INTERVALO_SALUD_MS = 30000;

export default function App() {
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