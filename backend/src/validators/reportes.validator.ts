import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El id debe ser un número." })
    .int("El id debe ser un entero.")
    .positive("El id debe ser positivo."),
});

export const generarReporteSchema = z.object({
  formato: z.enum(["pdf", "html", "json"], {
    errorMap: () => ({ message: "El formato debe ser pdf, html o json." }),
  }),
});

export type GenerarReporteDatos = z.infer<typeof generarReporteSchema>;