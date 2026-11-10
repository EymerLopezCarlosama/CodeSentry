"""Lectura segura de un archivo fuente para los generadores (pruebas y documentación).

Solo lectura: nunca escribe ni ejecuta nada del proyecto del usuario.
"""

import os

from app.utils.extensions import lenguaje_de


class ArchivoError(Exception):
    """Error de lectura o de generación con el formato del contrato: { codigo, mensaje } y un status HTTP."""

    def __init__(self, codigo: str, status: int, mensaje: str):
        super().__init__(mensaje)
        self.codigo, self.status, self.mensaje = codigo, status, mensaje


def leer_fuente(
    ruta_base: str,
    ruta_relativa: str,
    max_lineas: int,
    producto: str,
    solo_para: str,
) -> tuple[str, str, str, str | None]:
    """Devuelve (ruta relativa, lenguaje, código, aviso).

    `producto` completa el aviso de recorte ("las pruebas se generaron"); `solo_para` es el mensaje
    cuando la extensión no está soportada.
    """
    base = os.path.abspath(ruta_base)
    if not os.path.isdir(base):
        raise ArchivoError("RUTA_INEXISTENTE", 400, "La carpeta del proyecto no existe.")

    rel = ruta_relativa.replace("\\", "/")
    destino = os.path.abspath(os.path.join(base, rel))
    try:
        dentro = os.path.normcase(os.path.commonpath([base, destino])) == os.path.normcase(base)
    except ValueError:
        dentro = False
    if not dentro:
        raise ArchivoError("ARCHIVO_FUERA_DE_RUTA", 400, "El archivo debe estar dentro de la carpeta del proyecto.")

    lenguaje = lenguaje_de(destino)
    if lenguaje is None:
        raise ArchivoError("LENGUAJE_NO_SOPORTADO", 400, solo_para)
    if not os.path.isfile(destino):
        raise ArchivoError("ARCHIVO_INEXISTENTE", 400, "El archivo no existe.")
    try:
        with open(destino, encoding="utf-8") as f:
            codigo = f.read()
    except (OSError, UnicodeDecodeError):
        raise ArchivoError("ARCHIVO_ILEGIBLE", 400, "No se pudo leer el archivo.") from None
    if not codigo.strip():
        raise ArchivoError("ARCHIVO_VACIO", 400, "El archivo está vacío.")

    aviso = None
    lineas = codigo.splitlines()
    if len(lineas) > max_lineas:
        codigo = "\n".join(lineas[:max_lineas])
        aviso = f"El archivo tiene {len(lineas)} líneas: {producto} solo con las primeras {max_lineas}."
    return rel, lenguaje, codigo, aviso
