"""Explicación de hallazgos con IA.

El hallazgo (línea, tipo y severidad) ya viene decidido por las reglas: el modelo solo redacta una o dos
frases sobre ese código concreto. Si la respuesta no sirve, se usa la descripción fija de la tabla.
Solo lectura.
"""

import re
from collections.abc import Callable

from app.prompts.analisis import construir_prompt
from app.services import ollama_client
from app.services.reglas import HallazgoRegla

CONTEXTO = 3  # líneas de código a cada lado de la marcada
MAX_TOKENS = 110
MAX_CARACTERES = 320
MIN_CARACTERES = 25

_PREFIJO = re.compile(r"^(?:explicaci[oó]n|respuesta|soluci[oó]n|resumen)\s*:\s*", re.IGNORECASE)
_VINETA = re.compile(r"^\s*(?:[-*•]|\d+[.)])\s+", re.MULTILINE)


def fragmento(lineas: list[str], linea: int) -> str:
    """Código alrededor de `linea` (1 = primera), con números y la línea marcada con >>."""
    desde = max(1, linea - CONTEXTO)
    hasta = min(len(lineas), linea + CONTEXTO)
    filas = []
    for n in range(desde, hasta + 1):
        marca = ">>" if n == linea else "  "
        filas.append(f"{marca} {n} | {lineas[n - 1]}")
    return "\n".join(filas)


def limpiar(texto: str) -> str | None:
    """Deja la respuesta en texto plano de una o dos frases. None si no es utilizable."""
    t = re.sub(r"```.*?```", " ", texto, flags=re.DOTALL)
    t = t.replace("```", " ").replace("`", "").replace("**", "")
    t = _VINETA.sub("", t)
    t = re.sub(r"^#+\s*", "", t, flags=re.MULTILINE)
    t = " ".join(t.split())
    t = _PREFIJO.sub("", t).strip().strip('"“”').strip()
    if len(t) < MIN_CARACTERES:
        return None
    if len(t) > MAX_CARACTERES:
        corte = t.rfind(". ", 0, MAX_CARACTERES)
        t = t[: corte + 1] if corte >= MIN_CARACTERES else t[:MAX_CARACTERES].rstrip() + "…"
    return t


def explicar(
    hallazgo: HallazgoRegla,
    lineas_codigo: list[str],
    lenguaje: str,
    modelo: str,
    generar: Callable[..., str] | None = None,
) -> str:
    """Explicación del hallazgo, o su descripción fija si la IA no devuelve nada utilizable.
    OllamaNoDisponibleError se propaga a propósito: el que llama decide dejar de intentarlo."""
    if not 1 <= hallazgo.linea_codigo <= len(lineas_codigo):
        return hallazgo.descripcion
    llamar = generar or ollama_client.generar
    prompt = construir_prompt(hallazgo.descripcion, fragmento(lineas_codigo, hallazgo.linea_codigo), lenguaje)
    try:
        texto = llamar(modelo, prompt, formato=None, max_tokens=MAX_TOKENS)
    except ollama_client.OllamaNoDisponibleError:
        raise
    except ollama_client.OllamaError:
        return hallazgo.descripcion
    return limpiar(texto) or hallazgo.descripcion