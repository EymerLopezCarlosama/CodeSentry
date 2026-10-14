// PROMPT — components/proyectos/ProyectoList.tsx
//
// Tabla de proyectos: nombre, ruta, modelo de Ollama, fecha de registro y acciones Editar / Eliminar / Revisar. Eliminar abre el Modal de confirmación. Props: proyectos + callbacks.
// Componente de presentación: sin llamadas a la API (eso lo hacen hooks/pages). Props tipadas con TypeScript.
// Referencia: HU-02, HU-04

import Button from "../common/Button";
import { formatearFecha } from "../../utils/format";
import type { Proyecto } from "../../types";

interface ProyectoListProps {
  proyectos: Proyecto[];
  onEditar?: (proyecto: Proyecto) => void;
  onEliminar?: (proyecto: Proyecto) => void;
  onRevisar?: (proyecto: Proyecto) => void;
}

export default function ProyectoList({
  proyectos,
  onEditar,
  onEliminar,
  onRevisar,
}: ProyectoListProps) {
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Ruta</th>
          <th>Modelo</th>
          <th>Fecha de registro</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {proyectos.map((proyecto) => (
          <tr key={proyecto.id_proyecto}>
            <td>{proyecto.nombre}</td>
            <td>{proyecto.ruta_carpeta}</td>
            <td>{proyecto.modelo_ia}</td>
            <td>{formatearFecha(proyecto.fecha_registro)}</td>
            <td>
              <Button variante="secundario" onClick={() => onEditar?.(proyecto)}>
                Editar
              </Button>{" "}
              <Button variante="peligro" onClick={() => onEliminar?.(proyecto)}>
                Eliminar
              </Button>{" "}
              <Button onClick={() => onRevisar?.(proyecto)}>Revisar</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}