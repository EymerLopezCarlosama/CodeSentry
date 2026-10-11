import { probarConexion, pool } from "./config/database";

probarConexion().then(async (ok) => {
  console.log("Conexión a la BD:", ok);
  await pool.end();
});
