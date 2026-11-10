"""Prompt de documentación de un archivo (HU-11): docstrings/JSDoc y un resumen, sin tocar la lógica."""

NOMBRES = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}


def construir_prompt(codigo: str, lenguaje: str, ruta_relativa: str = "", estricto: bool = False) -> str:
    nombre = NOMBRES.get(lenguaje, lenguaje)
    if lenguaje == "py":
        formato = "docstrings de Python (triple comilla, con Args y Returns cuando aplique)"
    else:
        formato = "comentarios JSDoc (/** ... */, con @param y @returns cuando aplique)"

    partes: list[str] = []
    if estricto:
        partes.append(
            "Tu respuesta anterior no tenía el formato pedido. Responde ÚNICAMENTE con el documento Markdown: "
            "la primera línea debe ser el título que empieza con # y debe incluir las secciones ## Resumen y "
            "## Documentación propuesta."
        )
    partes += [
        f"Documenta el siguiente archivo {nombre}.",
        "Responde en español con un documento Markdown con exactamente esta estructura:",
        "# <nombre del archivo>",
        "## Resumen",
        "Dos o tres frases: qué hace el archivo y para qué sirve.",
        "## Documentación propuesta",
        f"Para cada función o clase que EXISTA en el código, un bloque de código con su {formato}, "
        "listo para pegarlo encima de la declaración. Pon el nombre real de la función antes de cada bloque.",
        "",
        "Reglas:",
        "1. No modifiques la lógica ni repitas el cuerpo de las funciones: solo escribe documentación.",
        "2. Documenta solo lo que exista en el código. No inventes funciones, parámetros ni comportamientos.",
        "3. Si algo no se puede saber leyendo el código, no lo afirmes.",
        "4. Sin texto fuera del documento, sin saludos ni explicaciones adicionales.",
        "",
        f"Archivo: {ruta_relativa or 'sin nombre'}",
        "<codigo>",
        codigo,
        "</codigo>",
    ]
    return "\n".join(partes)
