import { z } from "zod";

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El id debe ser un número." })
    .int("El id debe ser un entero.")
    .positive("El id debe ser positivo."),
});

export const MOTIVOS = ["falso_positivo", "no_aplica", "riesgo_aceptado"] as const;

export const marcarChecklistSchema = z
  .object({
    estado: z.enum(["pendiente", "aceptada", "rechazada"], {
      errorMap: () => ({
        message: "El estado debe ser pendiente, aceptada o rechazada.",
      }),
    }),
    motivo: z
      .enum(MOTIVOS, {
        errorMap: () => ({ message: "El motivo debe ser falso_positivo, no_aplica o riesgo_aceptado." }),
      })
      .optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.motivo !== undefined && datos.estado !== "rechazada") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["motivo"],
        message: "El motivo solo aplica al rechazar una sugerencia.",
      });
    }
  });

export type MarcarChecklistDatos = z.infer<typeof marcarChecklistSchema>;