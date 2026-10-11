const log = (nivel: string, ...args: unknown[]) =>
  console.log(`${new Date().toISOString()} [${nivel}]`, ...args);

export const logger = {
  info: (...a: unknown[]) => log("INFO", ...a),
  warn: (...a: unknown[]) => log("WARN", ...a),
  error: (...a: unknown[]) => log("ERROR", ...a),
};
