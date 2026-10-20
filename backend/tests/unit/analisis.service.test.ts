import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../../src/repositories/analisis.repository", () => ({
  obtenerContexto: vi.fn(),
  cambiarEstado: vi.fn(),
  insertarResultadosConChecklist: vi.fn(),
  obtenerPorId: vi.fn(),
}));
vi.mock("../../src/services/analyzer-client.service", () => ({
  crearTrabajo: vi.fn(),
  consultarTrabajo: vi.fn(),
}));

import * as repo from "../../src/repositories/analisis.repository";
import * as client from "../../src/services/analyzer-client.service";
import { ejecutar, obtener } from "../../src/services/analisis.service";

const hallazgo = {
  ruta_relativa: "app.js",
  tipo: "vulnerabilidad" as const,
  severidad: "alta" as const,
  linea_codigo: 3,
  descripcion: "SQL concatenado.",
};
const salida = (estado: "en_proceso" | "completado" | "fallido", procesados: number, resultados = [] as (typeof hallazgo)[]) => ({
  estado,
  progreso: { procesados, total: 2 },
  resultados,
  omitidos: [],
  errores: [],
});
const estadosGuardados = () => vi.mocked(repo.cambiarEstado).mock.calls.map((c) => c[1]);

async function correr(id: number) {
  const p = ejecutar(id);
  await vi.runAllTimersAsync();
  await p;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.mocked(repo.obtenerContexto).mockResolvedValue({
    id_analisis: 1,
    ruta_base: "D:/p",
    tipo_objetivo: "carpeta",
    ruta_relativa: null,
    modelo: "qwen2.5-coder",
    lenguajes: ["js", "ts"],
  });
  vi.mocked(repo.cambiarEstado).mockResolvedValue(true);
  vi.mocked(repo.insertarResultadosConChecklist).mockResolvedValue({ insertados: 1, omitidos: [] });
  vi.mocked(client.crearTrabajo).mockResolvedValue({ job_id: "j1" });
});
afterEach(() => vi.useRealTimers());

describe("analisis.service", () => {
  it("flujo feliz: en_proceso -> guarda resultados -> completado, con progreso", async () => {
    vi.mocked(client.consultarTrabajo)
      .mockResolvedValueOnce(salida("en_proceso", 1))
      .mockResolvedValueOnce(salida("completado", 2, [hallazgo]));
    await correr(1);

    expect(client.crearTrabajo).toHaveBeenCalledWith({
      ruta_base: "D:/p",
      objetivo: "carpeta",
      ruta_relativa: null,
      modelo: "qwen2.5-coder",
      lenguajes: ["js", "ts"],
    });
    expect(estadosGuardados()).toEqual(["en_proceso", "completado"]);
    expect(repo.insertarResultadosConChecklist).toHaveBeenCalledWith(1, [hallazgo]);

    vi.mocked(repo.obtenerPorId).mockResolvedValue({
      id_analisis: 1,
      modelo_ia_usado: "qwen2.5-coder",
      fecha_analisis: "2026-10-18",
      estado: "completado",
    });
    expect((await obtener(1)).progreso).toEqual({ procesados: 2, total: 2 });
  });

  it("si el analyzer dice fallido -> fallido y no guarda resultados", async () => {
    vi.mocked(client.consultarTrabajo).mockResolvedValue(salida("fallido", 2));
    await correr(2);
    expect(estadosGuardados()).toEqual(["en_proceso", "fallido"]);
    expect(repo.insertarResultadosConChecklist).not.toHaveBeenCalled();
  });

  it("si crearTrabajo falla (Ollama apagado) -> fallido", async () => {
    vi.mocked(client.crearTrabajo).mockRejectedValue(new Error("OLLAMA_NO_DISPONIBLE"));
    await correr(3);
    expect(estadosGuardados()).toEqual(["en_proceso", "fallido"]);
  });

  it("3 fallos seguidos al consultar -> fallido", async () => {
    vi.mocked(client.consultarTrabajo).mockRejectedValue(new Error("caído"));
    await correr(4);
    expect(client.consultarTrabajo).toHaveBeenCalledTimes(3);
    expect(estadosGuardados()).toEqual(["en_proceso", "fallido"]);
  });

  it("un fallo aislado al consultar no lo tumba", async () => {
    vi.mocked(client.consultarTrabajo)
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValueOnce(salida("completado", 2, [hallazgo]));
    await correr(5);
    expect(estadosGuardados()).toEqual(["en_proceso", "completado"]);
  });

  it("obtener inexistente -> 404", async () => {
    vi.mocked(repo.obtenerPorId).mockResolvedValue(null);
    await expect(obtener(99)).rejects.toMatchObject({ status: 404, codigo: "ANALISIS_NO_ENCONTRADO" });
  });
});