import os

EXTENSIONES: dict[str, str] = {".js": "js", ".ts": "ts", ".py": "py"}


def lenguaje_de(ruta: str) -> str | None:
    """'src/app.ts' -> 'ts'; extensión no soportada -> None."""
    return EXTENSIONES.get(os.path.splitext(ruta)[1].lower())


def es_soportado(ruta: str) -> bool:
    return lenguaje_de(ruta) is not None