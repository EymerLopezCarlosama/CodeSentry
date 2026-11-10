"""Generación de documentación de un archivo con la IA local (HU-11, opcional).

Solo lectura: devuelve el texto de la documentación; nunca modifica el archivo del usuario.
"""

import re

from app.core.config import settings
from app.prompts import documentacion as prompt_documentacion
from app.schemas.documentacion import EntradaDocumentacion, SalidaDocumentacion
from app.services import ollama_client
from app.services.archivo_fuente import ArchivoError, leer_fuente

MAX_LINEAS = 300
MAX_TOKENS = 1500
INTENTOS = 2
MIN_CARACTERES = 60

_VALLA_EXTERNA = re.compile(r"^```(?:markdown|md)\s*\n(.*)\n```\s*$", re.DOTALL | re.IGNORECASE)
_TITULO = re.compile(r"^#{1,3}\s+\S", re.MULTILINE)
_MARCADOR_DOC = re.compile(r'"""|\'\'\'|/\*\*')


def _leer(entrada: EntradaDocumentacion) -> tuple[str, str, str, str | None]:
    return leer_fuente(
        entrada.ruta_base,
        entrada.ruta_relativa,
        MAX_LINEAS,
        producto="la documentación se generó",
        solo_para="Solo se genera documentación para .js, .ts y .py.",
    )


def _limpiar(texto: str) -> str:
    """Quita la valla ```markdown que envuelve todo el documento (las internas, con código, se conservan)."""
    t = texto.strip()
    m = _VALLA_EXTERNA.match(t)
    return (m.group(1) if m else t).strip()


def _valido(contenido: str) -> bool:
    """Un documento utilizable tiene título y, o bien un bloque de documentación, o texto suficiente."""
    if len(contenido) < MIN_CARACTERES or not _TITULO.search(contenido):
        return False
    return bool(_MARCADOR_DOC.search(contenido)) or len(contenido) >= 3 * MIN_CARACTERES


def generar_documentacion(entrada: EntradaDocumentacion) -> SalidaDocumentacion:
    modelo = entrada.modelo or settings.OLLAMA_DEFAULT_MODEL
    rel, lenguaje, codigo, aviso = _leer(entrada)

    for intento in range(INTENTOS):
        prompt = prompt_documentacion.construir_prompt(codigo, lenguaje, rel, estricto=intento > 0)
        texto = ollama_client.generar(modelo, prompt, formato=None, max_tokens=MAX_TOKENS)
        contenido = _limpiar(texto)
        if _valido(contenido):
            return SalidaDocumentacion(contenido=contenido, aviso=aviso)

    raise ArchivoError(
        "RESPUESTA_INVALIDA", 502, "El modelo no devolvió documentación válida. Intente de nuevo o use otro modelo."
    )
