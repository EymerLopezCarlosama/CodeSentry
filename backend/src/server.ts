import { env } from "./config/env";
import { pool, probarConexion } from "./config/database";
import { app } from "./app";
import { logger } from "./utils/logger";

async function main() {
  if (!(await probarConexion())) {
    logger.warn("No se pudo conectar a la BD. ¿Está encendido el contenedor codesentry-db (puerto 3307)?");
  }
  app.listen(env.BACKEND_PORT, () => logger.info(`API lista en http://localhost:${env.BACKEND_PORT}/api`));
}

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

main();