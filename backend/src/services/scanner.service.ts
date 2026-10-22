// PROMPT — services/scanner.service.ts
//
// Recorrer la carpeta de un proyecto (fs, solo lectura) ignorando node_modules, .git, dist, build, __pycache__, .venv, y quedarse solo con .js/.ts/.py.
// Guardar cada archivo en la tabla Archivo con UPSERT sobre (id_proyecto, ruta_relativa): lenguaje "js"|"ts"|"py", nombre_archivo, ruta_relativa con "/". Así los Resultado ya guardados no se pierden al re-escanear.
// Devolver la lista de Archivo. Lo usan GET /proyectos/:id/archivos y revisiones.service.
//
// Depende de: utils/paths.ts, proyectos.repository.ts (agregar ahí las funciones de Archivo)
// Referencia: docs/api-contract.md (sección "Archivos del proyecto")
// Hecho cuando: escanear un proyecto de prueba lista solo sus .js/.ts/.py.

import type { Dirent } from "fs";
import fs from "fs/promises";
import path from "path";
import { AppError } from "../middlewares/error-handler";
import * as proyectosRepository from "../repositories/proyectos.repository";
import type { DatosArchivo } from "../repositories/proyectos.repository";
import type { Archivo, CodigoLenguaje } from "../types";
import { existeCarpeta, rutaRelativa } from "../utils/paths";

const CARPETAS_IGNORADAS = new Set(["node_modules", ".git", "dist", "build", "__pycache__", ".venv"]);

const LENGUAJE_POR_EXTENSION: Record<string, CodigoLenguaje> = {
  ".js": "js",
  ".ts": "ts",
  ".py": "py",
};

// Archivo.ruta_relativa es VARCHAR(255): las rutas más largas se omiten.
const MAX_LARGO_RUTA = 255;

async function recorrer(base: string, carpeta: string, encontrados: DatosArchivo[]): Promise<void> {
  let entradas: Dirent[];
  try {
    entradas = await fs.readdir(carpeta, { withFileTypes: true });
  } catch {
    return; // subcarpeta sin permiso de lectura: se omite
  }

  for (const entrada of entradas) {
    const completa = path.join(carpeta, entrada.name);

    if (entrada.isDirectory()) {
      if (!CARPETAS_IGNORADAS.has(entrada.name)) {
        await recorrer(base, completa, encontrados);
      }
    } else if (entrada.isFile()) {
      const lenguaje = LENGUAJE_POR_EXTENSION[path.extname(entrada.name).toLowerCase()];
      if (!lenguaje) continue;

      const relativa = rutaRelativa(base, completa);
      if (relativa.length > MAX_LARGO_RUTA) continue;

      encontrados.push({ nombre_archivo: entrada.name, ruta_relativa: relativa, lenguaje });
    }
  }
}

// Escanea la carpeta del proyecto y devuelve sus archivos soportados ya guardados en BD.
export async function escanear(idProyecto: number, rutaCarpeta: string): Promise<Archivo[]> {
  if (!(await existeCarpeta(rutaCarpeta))) {
    throw new AppError(400, "RUTA_INEXISTENTE", "La carpeta del proyecto ya no existe en este equipo.");
  }

  const encontrados: DatosArchivo[] = [];
  await recorrer(rutaCarpeta, rutaCarpeta, encontrados);
  return proyectosRepository.upsertarArchivos(idProyecto, encontrados);
}