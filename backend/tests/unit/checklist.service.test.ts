import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/checklist.repository", () => ({
  listarPorAnalisis: vi.fn(),
  obtenerPorId: vi.fn(),
  obtenerIdEstado: vi.fn(),
  actualizarEstado: vi.fn(),
}));

import * as repo from "../../src/repositories/checklist.repository";
import { marcar } from "../../src/services/checklist.service";

const item = {
  id_checklist: 1,
  id_resultado: 5,
  ruta_relativa: "a.js",
  linea_codigo: 3,
  tipo: "vulnerabilidad",
  severidad: "alta",
  descripcion: "x",
  estado: "pendiente",
  motivo: null,
  fecha_marcado: null,
} as never;

const FECHA = expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/);

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(repo.obtenerPorId).mockResolvedValue(item);
  vi.mocked(repo.obtenerIdEstado).mockResolvedValue(9);
  vi.mocked(repo.actualizarEstado).mockResolvedValue(1);
});

describe("checklist.service.marcar", () => {
  it("guarda el motivo al rechazar", async () => {
    await marcar(1, "rechazada", "falso_positivo");
    expect(repo.actualizarEstado).toHaveBeenCalledWith(1, 9, FECHA, "falso_positivo");
  });

  it("rechazar sin motivo guarda null", async () => {
    await marcar(1, "rechazada");
    expect(repo.actualizarEstado).toHaveBeenCalledWith(1, 9, FECHA, null);
  });

  it("aceptar descarta el motivo", async () => {
    await marcar(1, "aceptada", "falso_positivo");
    expect(repo.actualizarEstado).toHaveBeenCalledWith(1, 9, FECHA, null);
  });

  it("volver a pendiente borra fecha y motivo", async () => {
    await marcar(1, "pendiente");
    expect(repo.actualizarEstado).toHaveBeenCalledWith(1, 9, null, null);
  });
});