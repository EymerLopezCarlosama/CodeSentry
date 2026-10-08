# PROMPT — tests/test_file_scanner.py
#
# Con pytest y tmp_path: crear una carpeta con a.js, b.ts, c.py, main.go y un node_modules/x.js.
# Probar: (1) objetivo "carpeta" devuelve solo a.js/b.ts/c.py; (2) main.go aparece en omitidos como "lenguaje no soportado"; (3) node_modules se ignora; (4) objetivo "archivo" devuelve solo ese; (5) ruta_base inexistente lanza RUTA_INEXISTENTE.
#
# Depende de: services/file_scanner.py
