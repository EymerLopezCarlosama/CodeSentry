# PROMPT — services/file_scanner.py
#
# escanear(ruta_base, objetivo, ruta_relativa, lenguajes) → (archivos, omitidos).
# - objetivo "carpeta": recorrer con os.walk PODANDO IGNORED_DIRS (node_modules, .git, dist, build, __pycache__, .venv).
# - objetivo "archivo": solo ese archivo (ruta_relativa obligatoria).
# - Soportados (.js/.ts/.py y dentro de `lenguajes`) → archivos. Lo demás → omitidos con motivo "lenguaje no soportado".
# - ruta_base inexistente → error RUTA_INEXISTENTE. Rutas relativas siempre con "/". SOLO LECTURA: nunca escribir ni ejecutar nada.
#
# Depende de: core/config.py, utils/extensions.py
# Referencia: docs/analyzer-contract.md (reglas 1 y 2)
# Hecho cuando: pasan los tests de tests/test_file_scanner.py.
