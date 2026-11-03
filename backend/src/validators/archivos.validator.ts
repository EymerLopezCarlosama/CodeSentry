import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El id del archivo debe ser un número." })
    .int("El id del archivo debe ser un entero.")
    .positive("El id del archivo debe ser positivo."),
});