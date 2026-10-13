type Nivel = "INFO" | "WARN" | "ERROR";

function escribir(nivel: Nivel, ...mensajes: unknown[]): void {
  const prefijo = `${new Date().toISOString()} [${nivel}]`;
  if (nivel === "ERROR") console.error(prefijo, ...mensajes);
  else if (nivel === "WARN") console.warn(prefijo, ...mensajes);
  else console.log(prefijo, ...mensajes);
}

export const logger = {
  info: (...mensajes: unknown[]) => escribir("INFO", ...mensajes),
  warn: (...mensajes: unknown[]) => escribir("WARN", ...mensajes),
  error: (...mensajes: unknown[]) => escribir("ERROR", ...mensajes),
};