import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/proyectos.repository", () => ({
  upsertarArchivos: vi.fn(async (_id: number, datos: unknown[]) => datos),
}));

import { escanear } from "../../src/services/scanner.service";

let carpeta: string;

beforeEach(async () => {
  carpeta = await fs.mkdtemp(path.join(os.tmpdir(), "codesentry-"));
  await fs.mkdir(path.join(carpeta, "src"));
  await fs.mkdir(path.join(carpeta, "node_modules"));
  const archivos = [
    "a.js", "src/App.jsx", "src/Vista.tsx", "b.ts", "c.py", "main.go", "node_modules/x.js",
  ];
  for (const f of archivos) await fs.writeFile(path.join(carpeta, f), "x");
});

afterEach(async () => {
  await fs.rm(carpeta, { recursive: true, force: true });
});

describe("scanner.service", () => {
  it("incluye .jsx y .tsx con los códigos js y ts", async () => {
    const lista = (await escanear(1, carpeta)) as { ruta_relativa: string; lenguaje: string }[];
    const porRuta = Object.fromEntries(lista.map((a) => [a.ruta_relativa, a.lenguaje]));
    expect(porRuta).toEqual({
      "a.js": "js",
      "src/App.jsx": "js",
      "src/Vista.tsx": "ts",
      "b.ts": "ts",
      "c.py": "py",
    });
  });

  it("ignora node_modules y lo que no es código soportado", async () => {
    const rutas = ((await escanear(1, carpeta)) as { ruta_relativa: string }[]).map((a) => a.ruta_relativa);
    expect(rutas).not.toContain("main.go");
    expect(rutas.some((r) => r.includes("node_modules"))).toBe(false);
  });

  it("carpeta inexistente -> 400 RUTA_INEXISTENTE", async () => {
    await expect(escanear(1, path.join(carpeta, "no-existe"))).rejects.toMatchObject({
      status: 400,
      codigo: "RUTA_INEXISTENTE",
    });
  });
});