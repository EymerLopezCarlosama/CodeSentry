# PROMPT — prompts/analisis.py
#
# construir_prompt(codigo, lenguaje, offset, estricto=False) → str.
# Debe exigir al modelo responder SOLO JSON: una lista de { tipo, descripcion, severidad, linea_codigo }, con valores permitidos: tipo ∈ vulnerabilidad|mala_practica|refactorizacion · severidad ∈ baja|media|alta|critica · linea_codigo entero ≥ 1. Descripciones en español, breves y accionables.
# Numerar las líneas del código dentro del prompt (empezando en offset+1) para que el modelo cite la línea real. Con estricto=True (reintentos) añadir un ejemplo de salida válida y la regla "sin texto fuera del JSON".
# Referencia: docs/analyzer-contract.md (valores permitidos y reglas 3, 4, 6)
