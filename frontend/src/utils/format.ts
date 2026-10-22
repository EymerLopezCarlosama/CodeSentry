export function formatearFecha(fecha: string | null): string {
  if (!fecha) return "—";
  const [anio, mes, dia] = fecha.slice(0, 10).split("-");
  if (!anio || !mes || !dia) return fecha;
  return `${dia}/${mes}/${anio}`;
}

export function truncar(texto: string, n: number): string {
  if (texto.length <= n) return texto;
  return texto.slice(0, n).trimEnd() + "…";
}

const ETIQUETAS_SEVERIDAD: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  critica: "Crítica",
};

export function etiquetaSeveridad(severidad: string): string {
  return ETIQUETAS_SEVERIDAD[severidad] ?? severidad;
}

const ETIQUETAS_ESTADO_ANALISIS: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  completado: "Completado",
  fallido: "Fallido",
};

export function etiquetaEstadoAnalisis(estado: string): string {
  return ETIQUETAS_ESTADO_ANALISIS[estado] ?? estado;
}
