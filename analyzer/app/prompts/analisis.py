NOMBRES = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}

_EJEMPLO = (
    '[{"tipo": "vulnerabilidad", "descripcion": "Consulta SQL concatenada sin parametrizar.", '
    '"severidad": "alta", "linea_codigo": 42}]'
)


def _numerar(codigo: str, offset: int) -> str:
    """Prefija cada línea con su número real: offset+1, offset+2, ..."""
    return "\n".join(f"{offset + i} | {linea}" for i, linea in enumerate(codigo.splitlines(), start=1))


def construir_prompt(codigo: str, lenguaje: str, offset: int = 0, estricto: bool = False) -> str:
    nombre = NOMBRES.get(lenguaje, lenguaje)
    prompt = (
        f"Eres un revisor de código {nombre}. Analiza el siguiente fragmento y detecta "
        "vulnerabilidades de seguridad, malas prácticas y oportunidades de refactorización.\n\n"
        "Responde SOLO con JSON: una lista de objetos con exactamente estas claves:\n"
        '- "tipo": "vulnerabilidad" | "mala_practica" | "refactorizacion"\n'
        '- "descripcion": texto en español, breve y accionable (qué pasa y cómo corregirlo)\n'
        '- "severidad": "baja" | "media" | "alta" | "critica"\n'
        '- "linea_codigo": entero >= 1, el número de línea que aparece a la izquierda del código\n\n'
        "Si no hay hallazgos responde [].\n\n"
        "Código (cada línea empieza con su número):\n"
        f"{_numerar(codigo, offset)}\n"
    )
    if estricto:
        prompt += (
            "\nIMPORTANTE: tu respuesta anterior no fue JSON válido. "
            "Responde únicamente con el JSON, sin texto fuera del JSON, sin explicaciones ni bloques ```. "
            "Usa solo los valores permitidos de tipo y severidad.\n"
            f"Ejemplo de salida válida:\n{_EJEMPLO}\n"
        )
    return prompt