import { useNavigate } from "react-router-dom";
import ProyectoForm from "../components/proyectos/ProyectoForm";
import * as proyectosService from "../services/proyectos.service";
import type { DatosNuevoProyecto } from "../types";

export default function NuevoProyecto() {
  const navigate = useNavigate();

  async function guardar(datos: DatosNuevoProyecto): Promise<void> {
    await proyectosService.crear(datos);
    navigate("/proyectos");
  }

  return (
    <section>
      <h1>Nuevo proyecto</h1>
      <ProyectoForm onGuardar={guardar} textoBoton="Registrar proyecto" />
    </section>
  );
}