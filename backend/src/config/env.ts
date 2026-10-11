import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const schema = z.object({
  BACKEND_PORT: z.coerce.number().default(3001),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number(),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(""),
  DB_NAME: z.string().min(1),
  ANALYZER_URL: z.string().url(),
  REPORTS_DIR: z.string().min(1),
});

const resultado = schema.safeParse(process.env);
if (!resultado.success) {
  console.error("Variables de entorno inválidas en backend/.env:");
  console.error(resultado.error.issues.map((i) => `- ${i.path.join(".")}: ${i.message}`).join("\n"));
  process.exit(1);
}

export const env = resultado.data;