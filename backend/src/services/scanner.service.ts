// PROMPT — services/scanner.service.ts
//
// Recorrer la carpeta de un proyecto (fs, solo lectura) ignorando node_modules, .git, dist, build, __pycache__, .venv, y quedarse solo con .js/.ts/.py.
// Guardar cada archivo en la tabla Archivo con UPSERT sobre (id_proyecto, ruta_relativa): lenguaje "js"|"ts"|"py", nombre_archivo, ruta_relativa con "/". Así los Resultado ya guardados no se pierden al re-escanear.
// Devolver la lista de Archivo. Lo usan GET /proyectos/:id/archivos y revisiones.service.
//
// Depende de: utils/paths.ts, proyectos.repository.ts (agregar ahí las funciones de Archivo)
// Referencia: docs/api-contract.md (sección "Archivos del proyecto")
// Hecho cuando: escanear un proyecto de prueba lista solo sus .js/.ts/.py.
