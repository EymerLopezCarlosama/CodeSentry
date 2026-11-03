import re

FRAMEWORKS = {"js": "jest", "ts": "jest", "py": "pytest"}
NOMBRES = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}
_ESM = re.compile(r"^\s*(?:export\b|import\b[^\n(]*\bfrom\b)", re.MULTILINE)

def _base(ruta_relativa: str) -> str:
    return ruta_relativa.replace("\\", "/").rsplit("/", 1)[-1].rsplit(".", 1)[0]

def _importacion(codigo: str, lenguaje: str, ruta_relativa: str) -> str:
    if lenguaje == "py":
        sin_extension = ruta_relativa.replace("\\", "/").rsplit(".", 1)[0]
        modulo = ".".join(p for p in sin_extension.split("/") if p)
        return f"Importa lo que necesites con `from {modulo} import ...`."
    base = _base(ruta_relativa)
    if lenguaje == "js" and not _ESM.search(codigo):
        return f'El archivo de pruebas estará en la misma carpeta. Impórtalo con `const {{ ... }} = require("./{base}");`.'
    return f'El archivo de pruebas estará en la misma carpeta. Impórtalo con `import {{ ... }} from "./{base}";`.'

def construir_prompt(codigo: str, lenguaje: str, ruta_relativa: str = "", estricto: bool = False) -> str:
    framework = "PyTest" if lenguaje == "py" else "Jest"
    estilo = (
        "Funciones `test_...`; puedes usar `pytest.raises` y `pytest.mark.parametrize`."
        if lenguaje == "py"
        else "Usa `describe`, `test` y `expect` (son globales, no los importes); para errores usa `toThrow`."
    )
    partes: list[str] = []
    if estricto:
        partes.append(
            "Tu respuesta anterior no contenía pruebas válidas. Responde ÚNICAMENTE con el código del "
            "archivo de pruebas: la primera línea debe ser una importación o un describe/def test_."
        )
    partes += [
        f"Escribe pruebas unitarias con {framework} para el siguiente código {NOMBRES.get(lenguaje, lenguaje)}.",
        "Reglas:",
        "1. Cubre casos normales, casos borde (vacío, cero, null/None, límites) y casos de error esperados.",
        "2. Prueba solo funciones o clases que existan en el código. No inventes nada.",
        f"3. {_importacion(codigo, lenguaje, ruta_relativa)}",
        f"4. {estilo}",
        f"5. No uses librerías fuera de {framework} y la biblioteca estándar. Si una función toca archivos, "
        "red o base de datos, no la ejecutes de verdad: omítela o simúlala con las herramientas del framework.",
        "6. Nombres de pruebas y comentarios en español, breves.",
        "7. Responde SOLO con el código del archivo de pruebas, sin explicaciones ni bloques Markdown.",
        "8. Escribe MÁXIMO entre 3 y 5 funciones de prueba concisas en total. Queda prohibido repetir pruebas o encadenar prefijos en los nombres.",
        "",
        f"Archivo: {ruta_relativa or 'sin nombre'}",
        "<codigo>",
        codigo,
        "</codigo>",
    ]
    return "\n".join(partes)