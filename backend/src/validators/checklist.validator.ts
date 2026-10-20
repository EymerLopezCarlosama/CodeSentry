import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El id debe ser un número." })
    .int("El id debe ser un entero.")
    .positive("El id debe ser positivo."),
});

export const marcarChecklistSchema = z.object({
  estado: z.enum(["pendiente", "aceptada", "rechazada"], {
    errorMap: () => ({
      message: "El estado debe ser pendiente, aceptada o rechazada.",
    }),
  }),
});

export type MarcarChecklistDatos = z.infer<typeof marcarChecklistSchema>;