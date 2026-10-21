export { ErrorApi } from "../services/api";

export type Severidad = "baja" | "media" | "alta" | "critica";
export type EstadoChecklist = "pendiente" | "aceptada" | "rechazada";
export type NombreLenguaje = "JavaScript" | "TypeScript" | "Python";
export type TipoHallazgo = "vulnerabilidad" | "mala_practica" | "refactorizacion";

// Espejo de ProyectoRespuesta del backend (docs/api-contract.md)
export interface Proyecto {
  id_proyecto: number;
  nombre: string;
  ruta_carpeta: string;
  modelo_ia: string;
  lenguajes: NombreLenguaje[];
  fecha_registro: string;
  fecha_actualizacion: string | null;
  estado: string;
}

// Cuerpo de POST /proyectos
export interface DatosNuevoProyecto {
  nombre: string;
  ruta_carpeta: string;
  lenguajes: NombreLenguaje[];
  modelo_ia?: string;
}

// Cuerpo de PUT /proyectos/:id (cualquiera de los campos)
export type DatosActualizarProyecto = Partial<DatosNuevoProyecto>;

// Espejo de DashboardRespuesta del backend
export interface Dashboard {
  totales: { proyectos: number; analisis: number; hallazgos: number };
  por_severidad: Record<Severidad, number>;
  checklist: Record<EstadoChecklist, number>;
  por_proyecto: {
    id_proyecto: number;
    nombre: string;
    hallazgos: number;
    aceptadas: number;
    rechazadas: number;
  }[];
}

// Elemento del checklist (GET /analisis/:id/checklist)
export interface ItemChecklist {
  id_checklist: number;
  id_resultado: number;
  ruta_relativa: string;
  linea_codigo: number;
  tipo: TipoHallazgo;
  severidad: Severidad;
  descripcion: string;
  estado: EstadoChecklist;
  fecha_marcado: string | null;
}

export interface ModelosDisponibles {
  instalados: string[];
  permitidos: string[];
}

export type EstadoInstalacion = "descargando" | "completado" | "fallido";

export interface InstalacionModelo {
  modelo: string;
  estado: EstadoInstalacion;
  progreso: { completado: number; total: number };
  motivo?: string;
}

// Respuesta de GET /salud (hoy trae backend y base_datos; analyzer y ollama llegan con HU06)
export type Salud = Record<string, string>;