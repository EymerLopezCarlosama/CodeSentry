import { AppError } from "../middlewares/error-handler";
import * as analyzerClient from "./analyzer-client.service";
import * as proyectosRepository from "../repositories/proyectos.repository";

export interface RespuestaPruebas {
  framework: "jest" | "pytest";
  contenido: string;
  archivo_sugerido: string;
  aviso: string | null;
}

export interface RespuestaDocumentacion {
  contenido: string;
  archivo_sugerido: string;
  aviso: string | null;
}

function partesDelNombre(nombreArchivo: string): { base: string; extension: string } {
  const punto = nombreArchivo.lastIndexOf(".");
  return {
    base: punto > 0 ? nombreArchivo.slice(0, punto) : nombreArchivo,
    extension: punto > 0 ? nombreArchivo.slice(punto + 1) : "js",
  };
}

// calc.js -> calc.test.js · calc.ts -> calc.test.ts · calc.py -> test_calc.py
function nombrePruebas(nombreArchivo: string, framework: "jest" | "pytest"): string {
  const { base, extension } = partesDelNombre(nombreArchivo);
  return framework === "pytest" ? `test_${base}.py` : `${base}.test.${extension}`;
}

// calc.js -> calc.docs.md
function nombreDocumentacion(nombreArchivo: string): string {
  return `${partesDelNombre(nombreArchivo).base}.docs.md`;
}

async function cargarArchivoYProyecto(idArchivo: number) {
  const archivo = await proyectosRepository.obtenerArchivoPorId(idArchivo);
  if (!archivo) throw new AppError(404, "ARCHIVO_NO_ENCONTRADO", "El archivo no existe.");

  const proyecto = await proyectosRepository.obtenerPorId(archivo.id_proyecto);
  if (!proyecto) throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto del archivo no existe.");

  return { archivo, proyecto };
}

// HU-12 (opcional): solo devuelve el texto de las pruebas; nunca escribe en el proyecto del usuario.
export async function generarPruebas(idArchivo: number): Promise<RespuestaPruebas> {
  const { archivo, proyecto } = await cargarArchivoYProyecto(idArchivo);

  const salida = await analyzerClient.generarPruebas({
    ruta_base: proyecto.ruta_carpeta,
    ruta_relativa: archivo.ruta_relativa,
    modelo: proyecto.modelo_ia,
  });

  return {
    framework: salida.framework,
    contenido: salida.contenido,
    archivo_sugerido: nombrePruebas(archivo.nombre_archivo, salida.framework),
    aviso: salida.aviso,
  };
}

// HU-11 (opcional): solo devuelve el texto de la documentación; nunca modifica el archivo del usuario.
export async function generarDocumentacion(idArchivo: number): Promise<RespuestaDocumentacion> {
  const { archivo, proyecto } = await cargarArchivoYProyecto(idArchivo);

  const salida = await analyzerClient.generarDocumentacion({
    ruta_base: proyecto.ruta_carpeta,
    ruta_relativa: archivo.ruta_relativa,
    modelo: proyecto.modelo_ia,
  });

  return {
    contenido: salida.contenido,
    archivo_sugerido: nombreDocumentacion(archivo.nombre_archivo),
    aviso: salida.aviso,
  };
}
