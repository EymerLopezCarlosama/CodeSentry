# Alcance y lenguajes

Lenguajes analizados: JavaScript y TypeScript (`.js`, `.jsx`, `.ts`, `.tsx`) y Python (`.py`). El alcance lo define qué reglas existen para cada lenguaje, no el modelo de IA.

- **Restricción por extensión:** solo esos archivos se analizan; el resto se informa como "lenguaje no soportado".
- **Fuera de alcance:** Java, PHP, C#, C/C++, Go, Rust y otros. El escáner los reconoce y los cuenta, pero no hay reglas para analizarlos.
- **Carpetas ignoradas por defecto:** `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.venv`, `tests`, `__tests__` y `fixtures` (configurable con `IGNORED_DIRS`).
- **Silenciar un hallazgo ya revisado:** comentario `codesentry-ignore` en la línea o en la anterior (opcionalmente con el id de la regla, por ejemplo `codesentry-ignore: sql-inyeccion`).
- **Límites conocidos del motor:** ver `docs/evaluacion-motor.md`.
