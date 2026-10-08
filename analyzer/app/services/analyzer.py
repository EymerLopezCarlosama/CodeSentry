# PROMPT — services/analyzer.py
#
# Orquestador del análisis (asíncrono): guarda los trabajos en un dict en memoria {job_id: estado}.
# - crear_trabajo(entrada) → job_id y lanza el trabajo en segundo plano. consultar(job_id) → SalidaAnalisis (404 si no existe).
# Por cada archivo (de file_scanner): leer UTF-8 → partir en bloques de 200 líneas sumando el offset → construir_prompt → ollama_client.generar → parsear JSON; si es inválido reintentar hasta 3 veces con estricto=True; si sigue mal, el archivo va a `errores` y se continúa con los demás.
# Normalizar: linea_codigo fuera de rango → ajustarla al rango del archivo; tipo o severidad desconocidos → descartar ese hallazgo. Tiempo límite 120 s por archivo (si se excede → errores).
# Actualizar progreso (procesados/total) tras cada archivo. Estado final: "completado" si al menos un archivo se analizó, "fallido" si todos fallaron.
#
# Depende de: file_scanner.py, ollama_client.py, prompts/analisis.py, schemas/analisis.py
# Referencia: docs/analyzer-contract.md (reglas 1 a 8)
# Hecho cuando: un proyecto pequeño de prueba termina "completado" con resultados y progreso 100 %.
