"""Prompt de explicación de hallazgos (HU-06): la IA redacta, no detecta ni clasifica."""

NOMBRES = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}


def construir_prompt(descripcion: str, codigo: str, lenguaje: str, ejemplos: list[str] | None = None) -> str:
    nombre = NOMBRES.get(lenguaje, lenguaje)
    bloque = ""
    if ejemplos:
        lista = "\n".join(f"Ejemplo {i}: {e}" for i, e in enumerate(ejemplos, start=1))
        bloque = (
            "Explicaciones anteriores de este mismo tipo de problema que el equipo aceptó "
            "(imita su estilo y nivel de detalle, pero habla del código de abajo, no de esos ejemplos):\n"
            f"{lista}\n\n"
        )
    return (
        f"Eres un revisor de código {nombre}. Un analizador estático encontró este problema en la línea "
        "marcada con >>:\n"
        f"Problema: {descripcion}\n\n"
        f"{bloque}"
        f"Código:\n{codigo}\n\n"
        "Explica en español, en máximo dos frases, qué ocurre exactamente en la línea marcada y cómo "
        "corregirlo. Habla solo de ese problema, aunque veas otros cerca. Menciona los nombres reales que "
        "aparecen en el código. No repitas el código completo, no uses listas ni formato Markdown."
    )