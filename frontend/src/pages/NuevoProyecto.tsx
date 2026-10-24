import { useNavigate } from "react-router-dom";
import EncabezadoPagina from "../components/layout/EncabezadoPagina";
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
      <EncabezadoPagina
        titulo="Nuevo proyecto"
        descripcion="Elige la carpeta y CodeSentry detecta los lenguajes por ti."
      />
      <ProyectoForm onGuardar={guardar} textoBoton="Registrar proyecto" />
    </section>
  );
}