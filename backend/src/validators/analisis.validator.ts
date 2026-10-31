import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El id debe ser un número." })
    .int("El id debe ser un entero.")
    .positive("El id debe ser mayor que cero."),
});

// undefined / "" -> undefined; si viene un valor se valida como entero positivo
const enteroOpcional = (mensaje: string, max?: number) =>
  z.preprocess(
    (v) => (v === undefined || v === "" ? undefined : v),
    z.coerce
      .number({ invalid_type_error: mensaje })
      .int(mensaje)
      .positive(mensaje)
      .max(max ?? Number.MAX_SAFE_INTEGER, mensaje)
      .optional()
  );

export const listarAnalisisQuerySchema = z.object({
  proyecto: enteroOpcional("El proyecto debe ser un número entero positivo."),
  limite: enteroOpcional("El límite debe ser un entero entre 1 y 100.", 100),
});
