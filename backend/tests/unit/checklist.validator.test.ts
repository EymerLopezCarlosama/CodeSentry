import { describe, expect, it } from "vitest";
import { marcarChecklistSchema } from "../../src/validators/checklist.validator";

describe("marcarChecklistSchema", () => {
  it("acepta rechazar con motivo", () => {
    expect(marcarChecklistSchema.parse({ estado: "rechazada", motivo: "falso_positivo" })).toEqual({
      estado: "rechazada",
      motivo: "falso_positivo",
    });
  });

  it("acepta rechazar sin motivo", () => {
    expect(marcarChecklistSchema.parse({ estado: "rechazada" })).toEqual({ estado: "rechazada" });
  });

  it.each(["pendiente", "aceptada"])("rechaza un motivo con el estado %s", (estado) => {
    expect(marcarChecklistSchema.safeParse({ estado, motivo: "no_aplica" }).success).toBe(false);
  });

  it("rechaza un motivo desconocido", () => {
    expect(marcarChecklistSchema.safeParse({ estado: "rechazada", motivo: "porque si" }).success).toBe(false);
  });
});