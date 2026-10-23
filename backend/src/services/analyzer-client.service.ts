import { env } from "../config/env";
import { AppError } from "../middlewares/error-handler";

const TIMEOUT_MS = 10_000;

export type EstadoTrabajo = "en_proceso" | "completado" | "fallido";

export interface EntradaTrabajo {
  ruta_base: string;
  objetivo: "carpeta" | "archivo";
  ruta_relativa: string | null;
  modelo: string;
  lenguajes: ("js" | "ts" | "py")[];
}

export interface HallazgoAnalyzer {
  ruta_relativa: string;
  tipo: "vulnerabilidad" | "mala_practica" | "refactorizacion";
  severidad: "baja" | "media" | "alta" | "critica";
  linea_codigo: number;
  descripcion: string;
}

export interface SalidaTrabajo {
  estado: EstadoTrabajo;
  progreso: { procesados: number; total: number };
  resultados: HallazgoAnalyzer[];
  omitidos: { ruta_relativa: string; motivo: string }[];
  errores: { ruta_relativa: string; motivo: string }[];
}

export interface ListaModelos {
  instalados: string[];
  permitidos: string[];
}

export interface EstadoInstalacion {
  modelo: string;
  estado: "descargando" | "completado" | "fallido";
  progreso: { completado: number; total: number };
  motivo?: string;
}

export interface ResultadoEscaneo {
  soportados: Record<string, number>;
  no_soportados: Record<string, number>;
  total_archivos: number;
  truncado: boolean;
}

// Códigos con status propio; cualquier otro código del analyzer sale como 502 (api-contract).
const STATUS_PROPIOS: Record<string, number> = {
  MODELO_NO_PERMITIDO: 400,
  RUTA_INEXISTENTE: 400,
  DESCARGA_NO_ENCONTRADA: 404,
  JOB_NO_ENCONTRADO: 404,
};

const MENSAJES: Record<string, string> = {
  OLLAMA_NO_DISPONIBLE: "Ollama no está disponible. Enciéndelo e inténtalo de nuevo.",
  MODELO_NO_INSTALADO: "El modelo no está instalado en Ollama.",
  MODELO_NO_PERMITIDO: "Ese modelo no está en la lista de modelos permitidos.",
  RUTA_INEXISTENTE: "La ruta indicada no existe.",
  DESCARGA_NO_ENCONTRADA: "No hay una descarga registrada para ese modelo.",
  JOB_NO_ENCONTRADO: "El trabajo de análisis no existe en el analyzer.",
};

async function llamar<T>(
  metodo: "GET" | "POST",
  ruta: string,
  cuerpo?: unknown,
  timeoutMs: number = TIMEOUT_MS,
): Promise<{ status: number; datos: T }> {
  let res: Response;
  try {
    res = await fetch(`${env.ANALYZER_URL}${ruta}`, {
      method: metodo,
      headers: cuerpo ? { "Content-Type": "application/json" } : undefined,
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new AppError(502, "ANALYZER_NO_DISPONIBLE", "El analyzer no responde. Verifica que esté encendido.");
  }

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { codigo?: string } | null;
    const codigo = data?.codigo;
    if (codigo) {
      throw new AppError(STATUS_PROPIOS[codigo] ?? 502, codigo, MENSAJES[codigo] ?? codigo);
    }
    throw new AppError(502, "ANALYZER_ERROR", `El analyzer respondió con el estado ${res.status}.`);
  }
  return { status: res.status, datos: (await res.json()) as T };
}

export async function salud(): Promise<{ analyzer: "ok" | "error"; ollama: "ok" | "error" }> {
  try {
    const { datos } = await llamar<{ analyzer: string; ollama: string }>("GET", "/salud");
    return { analyzer: "ok", ollama: datos.ollama === "ok" ? "ok" : "error" };
  } catch {
    return { analyzer: "error", ollama: "error" };
  }
}

export async function modelos(): Promise<ListaModelos> {
  return (await llamar<ListaModelos>("GET", "/modelos")).datos;
}

export async function instalarModelo(modelo: string): Promise<{ status: number; datos: EstadoInstalacion }> {
  return llamar<EstadoInstalacion>("POST", "/modelos/instalar", { modelo });
}

export async function estadoInstalacion(modelo: string): Promise<EstadoInstalacion> {
  return (await llamar<EstadoInstalacion>("GET", `/modelos/instalar?modelo=${encodeURIComponent(modelo)}`)).datos;
}

export async function crearTrabajo(entrada: EntradaTrabajo): Promise<{ job_id: string }> {
  return (await llamar<{ job_id: string }>("POST", "/analisis", entrada)).datos;
}

export async function consultarTrabajo(jobId: string): Promise<SalidaTrabajo> {
  return (await llamar<SalidaTrabajo>("GET", `/analisis/${encodeURIComponent(jobId)}`)).datos;
}

export async function escanear(rutaBase: string): Promise<ResultadoEscaneo> {
  // El analyzer corta a los 10 s; damos margen para que responda con truncado: true.
  return (await llamar<ResultadoEscaneo>("POST", "/escaneo", { ruta_base: rutaBase }, 20_000)).datos;
}