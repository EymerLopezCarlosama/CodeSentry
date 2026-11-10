import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/proyectos.repository", () => ({
  obtenerArchivoPorId: vi.fn(),
  obtenerPorId: vi.fn(),
}));
vi.mock("../../src/services/analyzer-client.service", () => ({
  generarPruebas: vi.fn(),
  generarDocumentacion: vi.fn(),
}));

import * as proyectosRepo from "../../src/repositories/proyectos.repository";
import * as client from "../../src/services/analyzer-client.service";
import { generarDocumentacion, generarPruebas } from "../../src/services/archivos.service";

const archivo = (nombre: string) =>
  ({ id_archivo: 3, id_proyecto: 1, nombre_archivo: nombre, ruta_relativa: `src/${nombre}`, lenguaje: "js" }) as never;
const proyecto = { id_proyecto: 1, ruta_carpeta: "D:/p", modelo_ia: "qwen2.5-coder" } as never;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(proyectosRepo.obtenerPorId).mockResolvedValue(proyecto);
});

describe("generarPruebas", () => {
  it.each([
    ["calc.js", "jest", "calc.test.js"],
    ["util.ts", "jest", "util.test.ts"],
    ["calc.py", "pytest", "test_calc.py"],
  ] as const)("sugiere el nombre de %s (%s) como %s", async (nombre, framework, esperado) => {
    vi.mocked(proyectosRepo.obtenerArchivoPorId).mockResolvedValue(archivo(nombre));
    vi.mocked(client.generarPruebas).mockResolvedValue({ framework, contenido: "x", aviso: null });
    const r = await generarPruebas(3);
    expect(r.archivo_sugerido).toBe(esperado);
    expect(client.generarPruebas).toHaveBeenCalledWith({
      ruta_base: "D:/p",
      ruta_relativa: `src/${nombre}`,
      modelo: "qwen2.5-coder",
    });
  });

  it("archivo inexistente -> 404", async () => {
    vi.mocked(proyectosRepo.obtenerArchivoPorId).mockResolvedValue(null);
    await expect(generarPruebas(99)).rejects.toMatchObject({ status: 404, codigo: "ARCHIVO_NO_ENCONTRADO" });
    expect(client.generarPruebas).not.toHaveBeenCalled();
  });
});

describe("generarDocumentacion", () => {
  it("devuelve el texto, sugiere <nombre>.docs.md y conserva el aviso", async () => {
    vi.mocked(proyectosRepo.obtenerArchivoPorId).mockResolvedValue(archivo("calc.py"));
    vi.mocked(client.generarDocumentacion).mockResolvedValue({ contenido: "# calc", aviso: "recortado" });
    expect(await generarDocumentacion(3)).toEqual({
      contenido: "# calc",
      archivo_sugerido: "calc.docs.md",
      aviso: "recortado",
    });
    expect(client.generarDocumentacion).toHaveBeenCalledWith({
      ruta_base: "D:/p",
      ruta_relativa: "src/calc.py",
      modelo: "qwen2.5-coder",
    });
  });

  it("archivo inexistente -> 404 y no llama al analyzer", async () => {
    vi.mocked(proyectosRepo.obtenerArchivoPorId).mockResolvedValue(null);
    await expect(generarDocumentacion(99)).rejects.toMatchObject({ status: 404, codigo: "ARCHIVO_NO_ENCONTRADO" });
    expect(client.generarDocumentacion).not.toHaveBeenCalled();
  });

  it("proyecto inexistente -> 404", async () => {
    vi.mocked(proyectosRepo.obtenerArchivoPorId).mockResolvedValue(archivo("calc.py"));
    vi.mocked(proyectosRepo.obtenerPorId).mockResolvedValue(null);
    await expect(generarDocumentacion(3)).rejects.toMatchObject({ status: 404, codigo: "PROYECTO_NO_ENCONTRADO" });
  });
});
