// PROMPT — resultados.validator.ts — Validación de entrada (zod) de resultados (HU-07)
//
// params: id. query: severidad opcional ("baja"|"media"|"alta"|"critica").
//
// Esquemas zod con mensajes en español. Se aplican con middlewares/validate.ts.
//
// Depende de: zod (solo esquemas, sin lógica)
// Referencia: docs/api-contract.md (sección "Resultados") · tablas: Resultado, Archivo, ChecklistItem

import { z } from "zod";

export const idAnalisisParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El id del análisis debe ser un número." })
    .int("El id del análisis debe ser un entero.")
    .positive("El id del análisis debe ser positivo."),
});

export const listarResultadosQuerySchema = z.object({
  severidad: z
    .enum(["baja", "media", "alta", "critica"], {
      errorMap: () => ({ message: "La severidad debe ser baja, media, alta o critica." }),
    })
    .optional(),
});

export type ListarResultadosQuery = z.infer<typeof listarResultadosQuerySchema>;