import { describe, expect, it } from "vitest";
import { idParamSchema } from "../../src/validators/analisis.validator";

describe("idParamSchema", () => {
  it("convierte '7' en 7", () => {
    expect(idParamSchema.parse({ id: "7" })).toEqual({ id: 7 });
  });
  it.each(["0", "-1", "abc", "1.5"])("rechaza %s", (id) => {
    expect(idParamSchema.safeParse({ id }).success).toBe(false);
  });
});