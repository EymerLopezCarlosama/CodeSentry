// Lista de proyectos como tarjetas: nombre, ruta, lenguajes, modelo de Ollama, fecha de registro y
// acciones Editar / Eliminar / Revisar. Componente de presentación (sin llamadas a la API).
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
    <div className="proyectos-grid">
      {proyectos.map((proyecto) => (
        <article key={proyecto.id_proyecto} className="tarjeta proyecto-card">
          <div className="proyecto-cabecera">
            <span className="proyecto-avatar" aria-hidden="true">
              {proyecto.nombre.trim().charAt(0).toUpperCase() || "P"}
            </span>
            <div className="proyecto-titulo">
              <h3>{proyecto.nombre}</h3>
              <span className="proyecto-fecha">Registrado el {formatearFecha(proyecto.fecha_registro)}</span>
            </div>
          </div>

          <p className="proyecto-ruta" title={proyecto.ruta_carpeta}>
            {proyecto.ruta_carpeta}
          </p>

          <div className="chips">
            {proyecto.lenguajes.map((lenguaje) => (
              <span key={lenguaje} className={`chip chip-lang-${lenguaje.toLowerCase()}`}>
                {lenguaje}
              </span>
            ))}
            <span className="chip chip-modelo">{proyecto.modelo_ia}</span>
          </div>

          <div className="proyecto-acciones">
            <Button onClick={() => onRevisar?.(proyecto)}>Revisar</Button>
            <Button tamano="pequeno" variante="secundario" onClick={() => onEditar?.(proyecto)}>
              Editar
            </Button>
            <Button tamano="pequeno" variante="peligro" onClick={() => onEliminar?.(proyecto)}>
              Eliminar
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}