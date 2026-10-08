# PROMPT — services/ollama_client.py
#
# Cliente httpx de la API local de Ollama (settings.OLLAMA_URL).
# - listar_modelos(): GET /api/tags → lista de nombres.
# - generar(modelo, prompt): POST /api/generate con stream=false y format="json"; timeout = TIMEOUT_ARCHIVO. Devuelve el texto de la respuesta.
# Errores propios: no conecta → OLLAMA_NO_DISPONIBLE (503) · Ollama dice que el modelo no existe → MODELO_NO_INSTALADO (400).
#
# Depende de: core/config.py
# Referencia: docs/analyzer-contract.md (sección "Errores")
# Hecho cuando: pasan los tests con respuestas simuladas (tests/test_ollama_client.py).
