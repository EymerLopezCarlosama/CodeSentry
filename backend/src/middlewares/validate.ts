// PROMPT — middlewares/validate.ts
//
// Exportar `validate({ body?, params?, query? })`: recibe esquemas zod, parsea cada parte de la petición y reemplaza req.body/params/query por los datos ya parseados y convertidos (ej. id string → number).
// Si falla, llamar next(error) para que error-handler responda 400 DATOS_INVALIDOS.
// Hecho cuando: las rutas lo usan así: router.post("/", validate({ body: crearProyectoSchema }), controller.crear).
