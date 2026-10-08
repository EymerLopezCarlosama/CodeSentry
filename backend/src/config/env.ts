// PROMPT — config/env.ts
//
// Cargar el .env de la RAÍZ del repo con dotenv (ruta: path.resolve(__dirname, "../../../.env")) y validarlo con zod.
// Exportar un objeto `env` tipado: BACKEND_PORT (número, def. 3001), DB_HOST, DB_PORT (número), DB_USER, DB_PASSWORD (puede ser vacío), DB_NAME, ANALYZER_URL, REPORTS_DIR.
// Si falta una variable obligatoria, lanzar un error con mensaje claro y terminar el proceso (no arrancar a medias).
// Referencia: .env.example
// Hecho cuando: cualquier archivo puede hacer `import { env } from "../config/env"` y leer valores ya convertidos a su tipo.
