import os

FRAMEWORKS = {"js": "jest", "ts": "jest", "py": "pytest"}
NOMBRES = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}


def framework_de(lenguaje: str) -> str:
    return FRAMEWORKS[lenguaje]


def _modulo(ruta_relativa: str, lenguaje: str) -> str:
    """'src/app.ts' -> './app' (JS/TS, ruta relativa al test) o 'src.app' (Python)."""
    sin_ext = os.path.splitext(ruta_relativa)[0].replace(os.sep, "/")
    if lenguaje == "py":
        return sin_ext.replace("/", ".")
    return "./" + os.path.basename(sin_ext)


def construir_prompt(codigo: str, lenguaje: str, ruta_relativa: str | None = None) -> str:
    nombre = NOMBRES[lenguaje]
    framework = "Jest" if FRAMEWORKS[lenguaje] == "jest" else "PyTest"
    importacion = ""
    if ruta_relativa:
        importacion = f"El código vive en el módulo `{_modulo(ruta_relativa, lenguaje)}`: impórtalo desde ahí.\n"
    return (
        f"Eres un ingeniero de pruebas. Escribe pruebas unitarias con {framework} para el siguiente código {nombre}.\n\n"
        "Reglas:\n"
        "- Cubre casos normales, casos borde y casos de error.\n"
        "- El archivo de pruebas debe quedar listo para guardar y ejecutar.\n"
        "- No modifiques ni reescribas el código original.\n"
        f"- {importacion or 'Importa lo que necesites del código analizado.'}"
        "- Responde SOLO con el código del test: sin explicaciones y sin bloques ```.\n\n"
        "Código:\n"
        f"{codigo}\n"
    )