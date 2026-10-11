// Configuración y validación de variables de entorno con dotenv y Zod
import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const esquema = z.object({
  BACKEND_PORT: z.coerce.number().default(3001),
  DB_HOST: z.string().min(1, "DB_HOST es requerido"),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string().min(1, "DB_USER es requerido"),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().min(1, "DB_NAME es requerido"),
  ANALYZER_URL: z.string().url("ANALYZER_URL debe ser una URL válida"),
  REPORTS_DIR: z.string().min(1, "REPORTS_DIR es requerido"),
});

const resultado = esquema.safeParse(process.env);

if (!resultado.success) {
  console.error("❌ Error en las variables de entorno (backend/.env):");
  console.error(resultado.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = resultado.data;
export type Env = z.infer<typeof esquema>;