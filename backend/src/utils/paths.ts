import fs from "fs";
import path from "path";

export async function existeCarpeta(ruta: string): Promise<boolean> {
  try {
    return (await fs.promises.stat(ruta)).isDirectory();
  } catch {
    return false;
  }
}

export function normalizarRuta(ruta: string): string {
  return path.resolve(ruta);
}

export function rutaRelativa(base: string, archivo: string): string {
  return path.relative(base, archivo).split(path.sep).join("/");
}

export function estaDentroDe(base: string, destino: string): boolean {
  const rel = path.relative(path.resolve(base), path.resolve(destino));
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}