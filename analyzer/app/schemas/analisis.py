# PROMPT — schemas/analisis.py
#
# Modelos pydantic v2 del contrato: EntradaAnalisis (ruta_base, objetivo "carpeta"|"archivo", ruta_relativa opcional pero OBLIGATORIA si objetivo="archivo", modelo, lenguajes), Hallazgo, Progreso, Omitido, ErrorArchivo y SalidaAnalisis (estado, progreso, resultados, omitidos, errores).
# Usar Literal para tipo, severidad, lenguaje y estado, de modo que valores fuera del contrato sean rechazados.
# Referencia: docs/analyzer-contract.md
