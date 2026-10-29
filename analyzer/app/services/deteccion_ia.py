"""Detección con IA en categorías cerradas.

El modelo solo señala 'línea: categoría' de una lista fija. El tipo y la severidad salen de esta tabla,
no del modelo, y cada línea se valida contra el fragmento. Solo lectura.
"""

import re

from app.services.reglas import HallazgoRegla

NOMBRES = {"js": "JavaScript", "ts": "TypeScript", "py": "Python"}

# id -> (tipo, severidad, qué buscar (va en el prompt), descripción que ve el usuario)
CATEGORIAS: dict[str, tuple[str, str, str, str]] = {
    "variable-no-definida": (
        "mala_practica",
        "media",
        "se usa una variable que puede no tener valor asignado en algún camino del código",
        "Posible uso de una variable que no siempre está definida: puede fallar en ejecución. "
        "Inicialícela antes de la condición. Sugerido por la IA: verifíquelo.",
    ),
    "validacion-faltante": (
        "vulnerabilidad",
        "media",
        "datos externos (parámetros, cuerpo de una petición, entrada del usuario) usados sin validar",
        "Posible uso de datos externos sin validar. Compruebe tipo, formato y rango antes de usarlos. "
        "Sugerido por la IA: verifíquelo.",
    ),
    "xss": (
        "vulnerabilidad",
        "alta",
        "datos del usuario insertados en HTML sin escapar (innerHTML, document.write)",
        "Posible XSS: se inserta contenido del usuario en HTML sin escapar. Use textContent o escape el "
        "valor. Sugerido por la IA: verifíquelo.",
    ),
    "excepcion-ignorada": (
        "mala_practica",
        "media",
        "un error capturado y descartado sin registrarlo ni manejarlo (catch o except vacío)",
        "Se captura un error y se ignora: oculta fallos reales. Regístrelo o propáguelo. "
        "Sugerido por la IA: verifíquelo.",
    ),
    "recurso-sin-cerrar": (
        "mala_practica",
        "media",
        "un archivo, conexión o recurso que se abre y no se cierra",
        "Posible recurso sin cerrar: puede agotar descriptores o memoria. Ciérrelo siempre (finally o with). "
        "Sugerido por la IA: verifíquelo.",
    ),
    "logica-erronea": (
        "mala_practica",
        "media",
        "una condición o cálculo claramente incorrecto",
        "Posible error de lógica en esta condición o cálculo. Revíselo con un caso de prueba. "
        "Sugerido por la IA: verifíquelo.",
    ),
}

_LINEA = re.compile(r"^\W*(\d+)\s*[:|,;]\s*([a-z][a-z-]*)\W*$")


def construir_prompt(codigo: str, lenguaje: str, offset: int = 0) -> str:
    nombre = NOMBRES.get(lenguaje, lenguaje)
    lista = "\n".join(f"- {id_}: {datos[2]}" for id_, datos in CATEGORIAS.items())
    numerado = "\n".join(f"{offset + i} | {linea}" for i, linea in enumerate(codigo.splitlines(), start=1))
    return (
        f"Eres un revisor de código {nombre}. Lee el fragmento y marca SOLO los problemas de esta lista:\n"
        f"{lista}\n\n"
        "Responde una línea por problema con el formato NÚMERO: categoría. Usa solo categorías de la lista "
        "y el número que aparece a la izquierda de la línea. Si no hay ningún problema responde NINGUNO. "
        "No escribas nada más.\n\n"
        f"Código:\n{numerado}\n"
    )


def interpretar(texto: str, lineas: list[str], offset: int) -> list[HallazgoRegla]:
    """Convierte la respuesta en hallazgos. Descarta categorías inventadas, líneas fuera del fragmento
    y líneas vacías. `lineas` son las del fragmento; la primera es la número offset + 1."""
    resultado: list[HallazgoRegla] = []
    vistos: set[tuple[str, int]] = set()
    for crudo in texto.splitlines():
        m = _LINEA.match(crudo.strip().lower())
        if not m:
            continue
        numero, categoria = int(m.group(1)), m.group(2)
        if categoria not in CATEGORIAS:
            continue
        indice = numero - offset - 1
        if not 0 <= indice < len(lineas) or not lineas[indice].strip():
            continue
        if (categoria, numero) in vistos:
            continue
        vistos.add((categoria, numero))
        tipo, severidad, _, descripcion = CATEGORIAS[categoria]
        resultado.append(HallazgoRegla(categoria, tipo, severidad, numero, descripcion))
    return sorted(resultado, key=lambda h: (h.linea_codigo, h.regla))