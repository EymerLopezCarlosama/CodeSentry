# PROMPT — tests/test_ollama_client.py
#
# Con httpx.MockTransport (sin Ollama real): (1) listar_modelos parsea /api/tags; (2) generar devuelve el texto de la respuesta; (3) conexión rechazada → OLLAMA_NO_DISPONIBLE; (4) modelo inexistente → MODELO_NO_INSTALADO.
#
# Depende de: services/ollama_client.py
