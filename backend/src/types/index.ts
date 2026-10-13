// ── Uniones literales (iguales a los CHECK de la BD y al contrato) ──
export type Severidad = "baja" | "media" | "alta" | "critica";
export type TipoHallazgo = "vulnerabilidad" | "mala_practica" | "refactorizacion";
export type CodigoLenguaje = "js" | "ts" | "py";
export type NombreLenguaje = "JavaScript" | "TypeScript" | "Python";
export type EstadoAnalisis = "pendiente" | "en_proceso" | "completado" | "fallido";
export type EstadoChecklist = "pendiente" | "aceptada" | "rechazada";
export type FormatoReporte = "pdf" | "html" | "json";
export type TipoObjetivo = "carpeta" | "archivo";

// ── Filas de la BD (fechas como "YYYY-MM-DD" por dateStrings) ──
export interface Estado {
  id_estado: number;
  nombre_estado: string;
  contexto_modulo: string;
}

export interface Lenguaje {
  id_lenguaje: number;
  nombre: NombreLenguaje;
}

export interface Proyecto {
  id_proyecto: number;
  nombre: string;
  ruta_carpeta: string;
  modelo_ia: string;
  fecha_registro: string;
  fecha_actualizacion: string | null;
  id_estado: number;
}

export interface Archivo {
  id_archivo: number;
  id_proyecto: number;
  nombre_archivo: string;
  ruta_relativa: string;
  lenguaje: CodigoLenguaje;
}

export interface SolicitudRevision {
  id_solicitud: number;
  id_proyecto: number;
  tipo_objetivo: TipoObjetivo;
  id_archivo: number | null;
  fecha_solicitud: string;
}

export interface Analisis {
  id_analisis: number;
  id_solicitud: number;
  fecha_analisis: string;
  modelo_ia_usado: string;
  id_estado: number;
}

export interface Resultado {
  id_resultado: number;
  id_analisis: number;
  id_archivo: number;
  tipo: TipoHallazgo;
  descripcion: string;
  severidad: Severidad;
  linea_codigo: number;
}

export interface ChecklistItem {
  id_checklist: number;
  id_resultado: number;
  id_estado: number;
  fecha_marcado: string | null;
}

export interface Reporte {
  id_reporte: number;
  id_analisis: number;
  fecha_generacion: string;
  formato: FormatoReporte;
  ruta_archivo: string;
}

// ── Respuestas de la API (según docs/api-contract.md) ──
export interface ProyectoRespuesta {
  id_proyecto: number;
  nombre: string;
  ruta_carpeta: string;
  modelo_ia: string;
  lenguajes: NombreLenguaje[];
  fecha_registro: string;
  fecha_actualizacion: string | null;
  estado: string;
}

export interface Progreso {
  procesados: number;
  total: number;
}

export interface AnalisisRespuesta {
  id_analisis: number;
  estado: EstadoAnalisis;
  modelo_ia_usado: string;
  fecha_analisis: string;
  progreso: Progreso;
}

export interface Hallazgo {
  id_resultado: number;
  tipo: TipoHallazgo;
  severidad: Severidad;
  linea_codigo: number;
  descripcion: string;
  estado_checklist: EstadoChecklist;
}

export interface ResultadosAgrupados {
  estado: EstadoAnalisis;
  archivos: { ruta_relativa: string; hallazgos: Hallazgo[] }[];
}

export interface DashboardRespuesta {
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

export interface ProyectoDetalle extends Proyecto {
  estado: string;
  lenguajes: NombreLenguaje[];
}