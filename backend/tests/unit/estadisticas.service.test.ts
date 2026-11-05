import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/estadisticas.repository", () => ({ contarPorRegla: vi.fn() }));

import { calcular } from "../../src/services/estadisticas.service";

const fila = (o: Partial<Parameters<typeof calcular>[0]>) => ({
  regla: "eval",
  total: 20,
  aceptadas: 0,
  rechazadas: 0,
  pendientes: 0,
  falsos_positivos: 0,
  ...o,
});

describe("calcular", () => {
  it("sin marcas no hay porcentajes ni sugerencia", () => {
    const r = calcular(fila({ pendientes: 20 }));
    expect(r).toMatchObject({ muestra_suficiente: false, tasa_aceptacion: null, precision_estimada: null, sugerencia: null });
  });

  it("con menos de 10 marcadas no sugiere nada, aunque todo sea falso positivo", () => {
    const r = calcular(fila({ rechazadas: 9, falsos_positivos: 9 }));
    expect(r.muestra_suficiente).toBe(false);
    expect(r.precision_estimada).toBe(0);
    expect(r.sugerencia).toBeNull();
  });

  it("con 10 marcadas y muchos falsos positivos sugiere revisar la regla", () => {
    const r = calcular(fila({ aceptadas: 4, rechazadas: 6, falsos_positivos: 6 }));
    expect(r.muestra_suficiente).toBe(true);
    expect(r.precision_estimada).toBe(40);
    expect(r.sugerencia).not.toBeNull();
  });

  it("rechazar por no_aplica o riesgo_aceptado no baja la precisión", () => {
    const r = calcular(fila({ aceptadas: 2, rechazadas: 8, falsos_positivos: 0 }));
    expect(r.tasa_aceptacion).toBe(20);
    expect(r.precision_estimada).toBe(100);
    expect(r.sugerencia).toBeNull();
  });

  it("una regla fiable no genera sugerencia", () => {
    const r = calcular(fila({ aceptadas: 8, rechazadas: 2, falsos_positivos: 1 }));
    expect(r.precision_estimada).toBe(90);
    expect(r.sugerencia).toBeNull();
  });
});