import { z } from "zod";

const lenguajeSchema = z.enum(["JavaScript", "TypeScript", "Python"], {
  errorMap: () => ({ message: "Lenguaje no soportado. Use JavaScript, TypeScript o Python." }),
});

const camposProyecto = z.object({
  nombre: z
    .string({ required_error: "El nombre es obligatorio." })
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  ruta_carpeta: z
    .string({ required_error: "La ruta de la carpeta es obligatoria." })
    .trim()
    .min(1, "La ruta de la carpeta es obligatoria.")
    .max(255, "La ruta no puede superar 255 caracteres."),
  lenguajes: z
    .array(lenguajeSchema, { required_error: "Seleccione al menos un lenguaje." })
    .min(1, "Seleccione al menos un lenguaje.")
    .transform((lista) => [...new Set(lista)]),
  modelo_ia: z
    .string()
    .trim()
    .min(1, "El modelo no puede estar vacío.")
    .max(50, "El modelo no puede superar 50 caracteres."),
});

export const crearProyectoSchema = camposProyecto.partial({ modelo_ia: true });

export const actualizarProyectoSchema = camposProyecto
  .partial()
  .refine((datos) => Object.values(datos).some((valor) => valor !== undefined), {
    message: "Envíe al menos un campo para actualizar.",
  });

export const escanearProyectoSchema = camposProyecto.pick({ ruta_carpeta: true });

export const idParamSchema = z.object({
  id: z.coerce
    .number({ invalid_type_error: "El id debe ser un número." })
    .int("El id debe ser un entero.")
    .positive("El id debe ser positivo."),
});

export type CrearProyectoDatos = z.infer<typeof crearProyectoSchema>;
export type ActualizarProyectoDatos = z.infer<typeof actualizarProyectoSchema>;