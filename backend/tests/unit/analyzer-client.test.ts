import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/config/env", () => ({ env: { ANALYZER_URL: "http://analyzer.test" } }));

import * as client from "../../src/services/analyzer-client.service";

function respuesta(status: number, cuerpo: unknown) {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "Content-Type": "application/json" } });
}

afterEach(() => vi.unstubAllGlobals());

describe("analyzer-client", () => {
  it("salud no lanza si el analyzer está apagado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await client.salud()).toEqual({ analyzer: "error", ollama: "error" });
  });

  it("analyzer apagado -> 502 ANALYZER_NO_DISPONIBLE", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    await expect(client.modelos()).rejects.toMatchObject({ status: 502, codigo: "ANALYZER_NO_DISPONIBLE" });
  });

  it("OLLAMA_NO_DISPONIBLE se reenvía como 502 con el mismo código", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(503, { codigo: "OLLAMA_NO_DISPONIBLE" })));
    await expect(
      client.crearTrabajo({ ruta_base: "x", objetivo: "carpeta", ruta_relativa: null, modelo: "m", lenguajes: ["js"] }),
    ).rejects.toMatchObject({ status: 502, codigo: "OLLAMA_NO_DISPONIBLE" });
  });

  it("MODELO_NO_PERMITIDO conserva el 400", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(400, { codigo: "MODELO_NO_PERMITIDO" })));
    await expect(client.instalarModelo("raro")).rejects.toMatchObject({ status: 400, codigo: "MODELO_NO_PERMITIDO" });
  });

  it("instalarModelo devuelve el status del analyzer (200 o 202) y el cuerpo", async () => {
    const cuerpo = { modelo: "llama3", estado: "descargando", progreso: { completado: 0, total: 0 } };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(202, cuerpo)));
    expect(await client.instalarModelo("llama3")).toEqual({ status: 202, datos: cuerpo });
  });

  it("consultarTrabajo devuelve estado y progreso", async () => {
    const salida = {
      estado: "en_proceso",
      progreso: { procesados: 1, total: 2 },
      resultados: [],
      omitidos: [],
      errores: [],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(200, salida)));
    expect(await client.consultarTrabajo("abc123")).toEqual(salida);
  });

    it("escanear envía la ruta y devuelve los conteos", async () => {
    const cuerpo = { soportados: { JavaScript: 2 }, no_soportados: { PHP: 1 }, total_archivos: 5, truncado: false };
    const f = vi.fn().mockResolvedValue(respuesta(200, cuerpo));
    vi.stubGlobal("fetch", f);
    expect(await client.escanear("D:/p")).toEqual(cuerpo);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ ruta_base: "D:/p" });
  });

  it("RUTA_INEXISTENTE conserva el 400", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(400, { codigo: "RUTA_INEXISTENTE" })));
    await expect(client.escanear("D:/no")).rejects.toMatchObject({ status: 400, codigo: "RUTA_INEXISTENTE" });
  });
    it("escanear usa un timeout de 20 s y el resto de llamadas el de 10 s", async () => {
    const espia = vi.spyOn(AbortSignal, "timeout");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(respuesta(200, { soportados: {}, no_soportados: {}, total_archivos: 0, truncado: false })),
    );
    await client.escanear("D:/p");
    expect(espia).toHaveBeenLastCalledWith(20_000);

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuesta(200, { instalados: [], permitidos: [] })));
    await client.modelos();
    expect(espia).toHaveBeenLastCalledWith(10_000);
    espia.mockRestore();
  });
});