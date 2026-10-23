import os

EXTENSIONES: dict[str, str] = {".js": "js", ".ts": "ts", ".py": "py"}

NOMBRES_SOPORTADOS: dict[str, str] = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}

# Lenguajes reconocibles pero fuera del alcance del MVP (el escáner los informa, no los analiza).
EXTENSIONES_CONOCIDAS: dict[str, str] = {
    ".jsx": "JavaScript (JSX)",
    ".tsx": "TypeScript (TSX)",
    ".java": "Java",
    ".php": "PHP",
    ".cs": "C#",
    ".go": "Go",
    ".rs": "Rust",
    ".c": "C",
    ".h": "C/C++",
    ".cpp": "C++",
    ".cc": "C++",
    ".hpp": "C++",
    ".kt": "Kotlin",
    ".swift": "Swift",
    ".rb": "Ruby",
    ".dart": "Dart",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".vue": "Vue",
    ".sql": "SQL",
    ".html": "HTML",
    ".css": "CSS",
    ".sh": "Shell",
}


def lenguaje_de(ruta: str) -> str | None:
    """'src/app.ts' -> 'ts'; extensión no soportada -> None."""
    return EXTENSIONES.get(os.path.splitext(ruta)[1].lower())


def es_soportado(ruta: str) -> bool:
    return lenguaje_de(ruta) is not None


def clasificar(ruta: str) -> tuple[str, bool] | None:
    """(nombre del lenguaje, soportado) o None si la extensión no es código reconocible
    (.txt, .json, .md, imágenes, archivos sin extensión...)."""
    ext = os.path.splitext(ruta)[1].lower()
    codigo = EXTENSIONES.get(ext)
    if codigo:
        return NOMBRES_SOPORTADOS[codigo], True
    nombre = EXTENSIONES_CONOCIDAS.get(ext)
    return (nombre, False) if nombre else None