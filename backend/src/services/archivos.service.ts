import { AppError } from "../middlewares/error-handler";
import * as analyzerClient from "./analyzer-client.service";
import * as proyectosRepository from "../repositories/proyectos.repository";

export interface RespuestaPruebas {
  framework: "jest" | "pytest";
  contenido: string;
  archivo_sugerido: string;
  aviso: string | null;
}

// calc.js -> calc.test.js · calc.ts -> calc.test.ts · calc.py -> test_calc.py
function nombreSugerido(nombreArchivo: string, framework: "jest" | "pytest"): string {
  const punto = nombreArchivo.lastIndexOf(".");
  const base = punto > 0 ? nombreArchivo.slice(0, punto) : nombreArchivo;
  const extension = punto > 0 ? nombreArchivo.slice(punto + 1) : "js";
  return framework === "pytest" ? `test_${base}.py` : `${base}.test.${extension}`;
}

// HU-12 (opcional): solo devuelve el texto de las pruebas; nunca escribe en el proyecto del usuario.
export async function generarPruebas(idArchivo: number): Promise<RespuestaPruebas> {
  const archivo = await proyectosRepository.obtenerArchivoPorId(idArchivo);
  if (!archivo) throw new AppError(404, "ARCHIVO_NO_ENCONTRADO", "El archivo no existe.");

  const proyecto = await proyectosRepository.obtenerPorId(archivo.id_proyecto);
  if (!proyecto) throw new AppError(404, "PROYECTO_NO_ENCONTRADO", "El proyecto del archivo no existe.");

  const salida = await analyzerClient.generarPruebas({
    ruta_base: proyecto.ruta_carpeta,
    ruta_relativa: archivo.ruta_relativa,
    modelo: proyecto.modelo_ia,
  });

  return {
    framework: salida.framework,
    contenido: salida.contenido,
    archivo_sugerido: nombreSugerido(archivo.nombre_archivo, salida.framework),
    aviso: salida.aviso,
  };
}