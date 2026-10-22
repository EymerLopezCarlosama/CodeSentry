// PROMPT — revisiones.validator.ts — Validación de entrada (zod) de revisiones (HU-05)
//
// crearRevisionSchema: { id_proyecto, tipo_objetivo: "carpeta"|"archivo", id_archivo? } con refine: id_archivo obligatorio si es "archivo" y prohibido si es "carpeta".
//
// Esquemas zod con mensajes en español. Se aplican con middlewares/validate.ts.
//
// Depende de: zod (solo esquemas, sin lógica)
// Referencia: docs/api-contract.md (sección "Revisiones") · tablas: SolicitudRevision, Analisis

import { z } from "zod";

export const crearRevisionSchema = z
  .object({
    id_proyecto: z
      .number({
        required_error: "El proyecto es obligatorio.",
        invalid_type_error: "El id del proyecto debe ser un número.",
      })
      .int("El id del proyecto debe ser un entero.")
      .positive("El id del proyecto debe ser positivo."),
    tipo_objetivo: z.enum(["carpeta", "archivo"], {
      errorMap: () => ({ message: "El tipo de objetivo debe ser 'carpeta' o 'archivo'." }),
    }),
    id_archivo: z
      .number({ invalid_type_error: "El id del archivo debe ser un número." })
      .int("El id del archivo debe ser un entero.")
      .positive("El id del archivo debe ser positivo.")
      .optional(),
  })
  .superRefine((datos, ctx) => {
    if (datos.tipo_objetivo === "archivo" && datos.id_archivo === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id_archivo"],
        message: "El archivo es obligatorio cuando el objetivo es 'archivo'.",
      });
    }
    if (datos.tipo_objetivo === "carpeta" && datos.id_archivo !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["id_archivo"],
        message: "No envíe id_archivo cuando el objetivo es 'carpeta'.",
      });
    }
  });

export type CrearRevisionDatos = z.infer<typeof crearRevisionSchema>;