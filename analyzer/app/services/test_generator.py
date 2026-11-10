import re

from app.core.config import settings
from app.prompts import pruebas as prompt_pruebas
from app.schemas.pruebas import EntradaPruebas, SalidaPruebas
from app.services import ollama_client
from app.services.archivo_fuente import ArchivoError, leer_fuente

MAX_LINEAS = 300
MAX_TOKENS = 2000
INTENTOS = 2
_BLOQUE = re.compile(r"```[\w+-]*\n(.*?)```", re.DOTALL)

# Nombre histórico: las rutas y el resto del código lo siguen usando
PruebasError = ArchivoError


def _leer(entrada: EntradaPruebas) -> tuple[str, str, str, str | None]:
    return leer_fuente(
        entrada.ruta_base,
        entrada.ruta_relativa,
        MAX_LINEAS,
        producto="las pruebas se generaron",
        solo_para="Solo se generan pruebas para .js, .ts y .py.",
    )


def _limpiar(texto: str) -> str:
    m = _BLOQUE.search(texto)
    t = (m.group(1) if m else texto).strip()
    t = re.sub(r"^```[\w+-]*\n", "", t)
    t = re.sub(r"\n```\s*$", "", t)
    return t.strip()


def _valido(contenido: str, framework: str) -> bool:
    if framework == "pytest":
        return bool(re.search(r"^\s*(?:async\s+)?def\s+test_\w+", contenido, re.MULTILINE))
    return bool(re.search(r"\b(?:test|it)\s*\(", contenido)) and "expect" in contenido


def generar_pruebas(entrada: EntradaPruebas) -> SalidaPruebas:
    modelo = entrada.modelo or settings.OLLAMA_DEFAULT_MODEL
    rel, lenguaje, codigo, aviso = _leer(entrada)
    framework = prompt_pruebas.FRAMEWORKS[lenguaje]

    for intento in range(INTENTOS):
        prompt = prompt_pruebas.construir_prompt(codigo, lenguaje, rel, estricto=intento > 0)
        texto = ollama_client.generar(modelo, prompt, formato=None, max_tokens=MAX_TOKENS)
        contenido = _limpiar(texto)
        if _valido(contenido, framework):
            return SalidaPruebas(framework=framework, contenido=contenido, aviso=aviso)

    raise PruebasError(
        "RESPUESTA_INVALIDA", 502, "El modelo no devolvió pruebas válidas. Intente de nuevo o use otro modelo."
    )
