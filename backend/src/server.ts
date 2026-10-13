import { env } from "./config/env";
import { pool, probarConexion } from "./config/database";
import { app } from "./app";
import { logger } from "./utils/logger";

async function iniciar(): Promise<void> {
  const baseDatosOk = await probarConexion();
  if (baseDatosOk) {
    logger.info("Conexión a la base de datos: ok");
  } else {
    logger.warn(
      `No se pudo conectar a MySQL en ${env.DB_HOST}:${env.DB_PORT}. ¿Está encendido Docker (docker compose up -d)?`
    );
  }

  const servidor = app.listen(env.BACKEND_PORT, () => {
    logger.info(`Servidor escuchando en http://localhost:${env.BACKEND_PORT}/api`);
  });

  process.on("SIGINT", async () => {
    logger.info("Cerrando servidor...");
    servidor.close();
    await pool.end();
    process.exit(0);
  });
}

iniciar().catch((err) => {
  logger.error("No se pudo iniciar el servidor:", err);
  process.exit(1);
});