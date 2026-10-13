import fs from "fs/promises";
import path from "path";

export async function existeCarpeta(ruta: string): Promise<boolean> {
  try {
    const info = await fs.stat(ruta);
    return info.isDirectory();
  } catch {
    return false;
  }
}

export function normalizarRuta(ruta: string): string {
  // path.resolve vuelve la ruta absoluta y quita el separador final
  return path.resolve(ruta);
}

export function rutaRelativa(base: string, archivo: string): string {
  return path.relative(base, archivo).split(path.sep).join("/");
}

export function estaDentroDe(base: string, destino: string): boolean {
  const rel = path.relative(path.resolve(base), path.resolve(destino));
  if (rel === "") return true;
  if (rel === ".." || rel.startsWith(".." + path.sep)) return false;
  return !path.isAbsolute(rel);
}