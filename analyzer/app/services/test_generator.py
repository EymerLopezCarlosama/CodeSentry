import os
import re
from app.core.config import settings
from app.prompts import pruebas as prompt_pruebas
from app.schemas.pruebas import EntradaPruebas, SalidaPruebas
from app.services import ollama_client
from app.utils.extensions import lenguaje_de

MAX_LINEAS = 300
MAX_TOKENS = 2000
INTENTOS = 2
_BLOQUE = re.compile(r"```[\w+-]*\n(.*?)```", re.DOTALL)

class PruebasError(Exception):
    def __init__(self, codigo: str, status: int, mensaje: str):
        super().__init__(mensaje)
        self.codigo, self.status, self.mensaje = codigo, status, mensaje

def _leer(entrada: EntradaPruebas) -> tuple[str, str, str, str | None]:
    base = os.path.abspath(entrada.ruta_base)
    if not os.path.isdir(base):
        raise PruebasError("RUTA_INEXISTENTE", 400, "La carpeta del proyecto no existe.")

    rel = entrada.ruta_relativa.replace("\\", "/")
    destino = os.path.abspath(os.path.join(base, rel))
    try:
        dentro = os.path.normcase(os.path.commonpath([base, destino])) == os.path.normcase(base)
    except ValueError:
        dentro = False
    if not dentro:
        raise PruebasError("ARCHIVO_FUERA_DE_RUTA", 400, "El archivo debe estar dentro de la carpeta del proyecto.")

    lenguaje = lenguaje_de(destino)
    if lenguaje is None:
        raise PruebasError("LENGUAJE_NO_SOPORTADO", 400, "Solo se generan pruebas para .js, .ts y .py.")
    if not os.path.isfile(destino):
        raise PruebasError("ARCHIVO_INEXISTENTE", 400, "El archivo no existe.")
    try:
        with open(destino, encoding="utf-8") as f:
            codigo = f.read()
    except (OSError, UnicodeDecodeError):
        raise PruebasError("ARCHIVO_ILEGIBLE", 400, "No se pudo leer el archivo.") from None
    if not codigo.strip():
        raise PruebasError("ARCHIVO_VACIO", 400, "El archivo está vacío.")

    aviso = None
    lineas = codigo.splitlines()
    if len(lineas) > MAX_LINEAS:
        codigo = "\n".join(lineas[:MAX_LINEAS])
        aviso = (
            f"El archivo tiene {len(lineas)} líneas: las pruebas se generaron solo con las "
            f"primeras {MAX_LINEAS}."
        )
    return rel, lenguaje, codigo, aviso

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