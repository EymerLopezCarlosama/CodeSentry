import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/services/analisis.service", () => ({ obtener: vi.fn() }));
vi.mock("../../src/repositories/resultados.repository", () => ({
  listarPorAnalisis: vi.fn(),
  obtenerContextoCodigo: vi.fn(),
}));

import * as repo from "../../src/repositories/resultados.repository";
import { obtenerCodigo } from "../../src/services/resultados.service";

let carpeta: string;

function contexto(ruta_relativa: string, linea_codigo: number) {
  return { ruta_carpeta: carpeta, ruta_relativa, lenguaje: "js", linea_codigo } as never;
}

beforeEach(async () => {
  carpeta = await fs.mkdtemp(path.join(os.tmpdir(), "codesentry-"));
  const veinte = Array.from({ length: 20 }, (_, i) => `linea ${i + 1}`).join("\n") + "\n";
  await fs.writeFile(path.join(carpeta, "app.js"), veinte);
  await fs.writeFile(path.join(carpeta, "windows.js"), "uno\r\ndos\r\ntres\r\n");
});

afterEach(async () => {
  vi.resetAllMocks();
  await fs.rm(carpeta, { recursive: true, force: true });
});

describe("obtenerCodigo", () => {
  it("devuelve las líneas alrededor del hallazgo", async () => {
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("app.js", 10));
    const r = await obtenerCodigo(1, 2);
    expect(r.desde).toBe(8);
    expect(r.hasta).toBe(12);
    expect(r.total_lineas).toBe(20);
    expect(r.linea_fuera_de_rango).toBe(false);
    expect(r.lineas.map((l) => l.numero)).toEqual([8, 9, 10, 11, 12]);
    expect(r.lineas[2]).toEqual({ numero: 10, texto: "linea 10" });
  });

  it("no pasa del inicio ni del final del archivo", async () => {
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("app.js", 1));
    const inicio = await obtenerCodigo(1, 3);
    expect([inicio.desde, inicio.hasta]).toEqual([1, 4]);

    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("app.js", 20));
    const final = await obtenerCodigo(1, 3);
    expect([final.desde, final.hasta]).toEqual([17, 20]);
  });

  it("si la línea ya no existe, avisa y muestra el final del archivo", async () => {
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("app.js", 99));
    const r = await obtenerCodigo(1, 2);
    expect(r.linea_fuera_de_rango).toBe(true);
    expect(r.linea).toBe(99);
    expect(r.hasta).toBe(20);
  });

  it("entiende saltos de línea de Windows y no cuenta el salto final", async () => {
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("windows.js", 2));
    const r = await obtenerCodigo(1, 5);
    expect(r.total_lineas).toBe(3);
    expect(r.lineas.map((l) => l.texto)).toEqual(["uno", "dos", "tres"]);
  });

  it("rechaza una ruta que sale de la carpeta del proyecto", async () => {
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("../fuera.js", 1));
    await expect(obtenerCodigo(1)).rejects.toMatchObject({ status: 400, codigo: "RUTA_INVALIDA" });
  });

  it("archivo borrado -> 404 ARCHIVO_NO_ENCONTRADO", async () => {
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("borrado.js", 1));
    await expect(obtenerCodigo(1)).rejects.toMatchObject({ status: 404, codigo: "ARCHIVO_NO_ENCONTRADO" });
  });

  it("hallazgo inexistente -> 404 RESULTADO_NO_ENCONTRADO", async () => {
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(null);
    await expect(obtenerCodigo(99)).rejects.toMatchObject({ status: 404, codigo: "RESULTADO_NO_ENCONTRADO" });
  });

  it("archivo de más de 2 MB -> 413", async () => {
    await fs.writeFile(path.join(carpeta, "gigante.js"), "x".repeat(2 * 1024 * 1024 + 1));
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("gigante.js", 1));
    await expect(obtenerCodigo(1)).rejects.toMatchObject({ status: 413, codigo: "ARCHIVO_DEMASIADO_GRANDE" });
  });

  it("recorta las líneas larguísimas", async () => {
    await fs.writeFile(path.join(carpeta, "min.js"), "a".repeat(2000) + "\n");
    vi.mocked(repo.obtenerContextoCodigo).mockResolvedValue(contexto("min.js", 1));
    const r = await obtenerCodigo(1);
    expect(r.lineas[0].texto.length).toBe(501);
    expect(r.lineas[0].texto.endsWith("…")).toBe(true);
  });
});