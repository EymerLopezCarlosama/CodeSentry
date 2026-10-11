import { Router } from "express";
import { probarConexion } from "../config/database";

const router = Router();

router.get("/salud", async (_req, res) => {
  const bd = await probarConexion();
  res.json({
    backend: "ok",
    base_datos: bd ? "ok" : "error",
    analyzer: "error", // se conecta con analyzer-client en HU-06
    ollama: "error",
  });
});

// router.use("/proyectos", proyectosRoutes);  <- Jhon y Pao agregan los suyos aquí

export default router;