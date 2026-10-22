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


// HU05: archivos, revisiones y análisis (docs/api-contract.md)
export type CodigoLenguaje = "js" | "ts" | "py";
export type TipoObjetivo = "carpeta" | "archivo";
export type EstadoAnalisis = "pendiente" | "en_proceso" | "completado" | "fallido";

// Respuesta de GET /proyectos/:id/archivos
export interface Archivo {
  id_archivo: number;
  nombre_archivo: string;
  ruta_relativa: string;
  lenguaje: CodigoLenguaje;
}

// Cuerpo de POST /revisiones
export interface DatosNuevaRevision {
  id_proyecto: number;
  tipo_objetivo: TipoObjetivo;
  id_archivo?: number;
}

// Respuesta 202 de POST /revisiones
export interface RevisionCreada {
  id_solicitud: number;
  id_analisis: number;
  estado: "pendiente";
}

export interface Progreso {
  procesados: number;
  total: number;
}

// Respuesta de GET /analisis/:id
export interface Analisis {
  id_analisis: number;
  estado: EstadoAnalisis;
  modelo_ia_usado: string;
  fecha_analisis: string;
  progreso: Progreso;
}

// HU07: resultados de un análisis (docs/api-contract.md)

export interface Hallazgo {
  id_resultado: number;
  tipo: TipoHallazgo;
  severidad: Severidad;
  linea_codigo: number;
  descripcion: string;
  estado_checklist: EstadoChecklist;
}

export interface ArchivoConHallazgos {
  ruta_relativa: string;
  hallazgos: Hallazgo[];
}

// Respuesta de GET /analisis/:id/resultados
export interface ResultadosAgrupados {
  estado: EstadoAnalisis;
  archivos: ArchivoConHallazgos[];
}

// HU08: reportes
export type FormatoReporte = "pdf" | "html" | "json";

export interface Reporte {
  id_reporte: number;
  id_analisis: number;
  fecha_generacion: string;
  formato: FormatoReporte;
  ruta_archivo: string;
}

export interface ReporteGenerado {
  id_reporte: number;
  formato: FormatoReporte;
  ruta_archivo: string;
}