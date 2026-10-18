import os

from app.core.config import settings
from app.schemas.analisis import Omitido
from app.utils.extensions import lenguaje_de

MOTIVO_NO_SOPORTADO = "lenguaje no soportado"


class RutaInexistenteError(Exception):
    """ruta_base o archivo pedido no existe (contrato: RUTA_INEXISTENTE, 400)."""

    codigo = "RUTA_INEXISTENTE"
    status = 400


def _relativa(base: str, ruta: str) -> str:
    return os.path.relpath(ruta, base).replace(os.sep, "/")


def _clasificar(rel: str, lenguajes: list[str], archivos: list[str], omitidos: list[Omitido]) -> None:
    lang = lenguaje_de(rel)
    if lang is not None and lang in lenguajes:
        archivos.append(rel)
    else:
        omitidos.append(Omitido(ruta_relativa=rel, motivo=MOTIVO_NO_SOPORTADO))


def escanear(
    ruta_base: str,
    objetivo: str,
    ruta_relativa: str | None,
    lenguajes: list[str],
) -> tuple[list[str], list[Omitido]]:
    """Devuelve (archivos a analizar, omitidos). Solo lectura."""
    if not os.path.isdir(ruta_base):
        raise RutaInexistenteError(ruta_base)
    base = os.path.abspath(ruta_base)
    ignorados = set(settings.IGNORED_DIRS)
    archivos: list[str] = []
    omitidos: list[Omitido] = []

    if objetivo == "archivo":
        if not ruta_relativa:
            raise RutaInexistenteError("ruta_relativa es obligatoria")
        destino = os.path.abspath(os.path.join(base, ruta_relativa))
        # evita path traversal (../) y rutas que no son archivo
        if os.path.commonpath([base, destino]) != base or not os.path.isfile(destino):
            raise RutaInexistenteError(ruta_relativa)
        _clasificar(_relativa(base, destino), lenguajes, archivos, omitidos)
        return archivos, omitidos

    for raiz, dirs, nombres in os.walk(base):
        dirs[:] = sorted(d for d in dirs if d not in ignorados)  # poda: no entra
        for nombre in sorted(nombres):
            _clasificar(_relativa(base, os.path.join(raiz, nombre)), lenguajes, archivos, omitidos)
    return archivos, omitidos