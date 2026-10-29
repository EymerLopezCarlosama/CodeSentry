"""Prompt de explicación de hallazgos (HU-06): la IA redacta, no detecta ni clasifica."""

NOMBRES = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}


def construir_prompt(descripcion: str, codigo: str, lenguaje: str) -> str:
    nombre = NOMBRES.get(lenguaje, lenguaje)
    return (
        f"Eres un revisor de código {nombre}. Un analizador estático encontró este problema en la línea "
        "marcada con >>:\n"
        f"Problema: {descripcion}\n\n"
        f"Código:\n{codigo}\n\n"
        "Explica en español, en máximo dos frases, qué ocurre exactamente en la línea marcada y cómo "
        "corregirlo. Habla solo de ese problema, aunque veas otros cerca. Menciona los nombres reales que "
        "aparecen en el código. No repitas el código completo, no uses listas ni formato Markdown."
    )