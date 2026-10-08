# PROMPT — api/routes.py
#
# APIRouter con: GET /salud · GET /modelos · POST /analisis (202 + { job_id }) · GET /analisis/{job_id} (404 si no existe).
# Traducir los errores propios a las respuestas del contrato: OLLAMA_NO_DISPONIBLE → 503 · MODELO_NO_INSTALADO → 400 · RUTA_INEXISTENTE → 400, todos como { "codigo": "..." }.
# Los endpoints opcionales POST /documentacion (HU-11) y POST /pruebas (HU-12) se agregan al final.
#
# Depende de: services/analyzer.py, services/ollama_client.py, schemas/analisis.py
# Referencia: docs/analyzer-contract.md (sección "Endpoints" y "Errores")
