// PROMPT — utils/paths.ts
//
// Utilidades de rutas del sistema de archivos local (solo lectura, nunca modifican nada):
// - existeCarpeta(ruta): Promise<boolean> (fs.promises.stat + isDirectory).
// - normalizarRuta(ruta): path.resolve y sin separador final (en Windows, "D:\\Proyectos\\mi-api").
// - rutaRelativa(base, archivo): relativa a la base y SIEMPRE con "/" (para guardar en Archivo.ruta_relativa).
// - estaDentroDe(base, destino): evita que una ruta relativa salga de la carpeta del proyecto (path traversal).
// Hecho cuando: las usan proyectos.service y scanner.service.
