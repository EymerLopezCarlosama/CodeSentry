# PROMPT — core/config.py
#
# Leer el .env de la RAÍZ del repo (python-dotenv) y exponer un objeto `settings`: OLLAMA_URL, OLLAMA_DEFAULT_MODEL, IGNORED_DIRS (lista, separada por comas), SUPPORTED_EXTENSIONS (lista), ANALYZER_PORT.
# Constantes fijas del contrato: TIMEOUT_ARCHIVO = 120 s, TAMANO_BLOQUE = 200 líneas, MAX_REINTENTOS = 3.
# Referencia: .env.example · docs/analyzer-contract.md
