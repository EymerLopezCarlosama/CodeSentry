import time
from pathlib import Path

from app.core.config import settings
from app.services.explicacion import explicar
from app.services.reglas import analizar

RAIZ = Path("tests/fixtures/vulnerable_codebase")
ARCHIVOS = [("javascript/app.js", "js"), ("python/vulnerable_service.py", "py"), ("typescript/userManager.ts", "ts")]

total = 0.0
cantidad = 0
for ruta, lenguaje in ARCHIVOS:
    codigo = (RAIZ / ruta).read_text(encoding="utf-8")
    lineas = codigo.splitlines()
    print(f"== {ruta}")
    for h in analizar(codigo, lenguaje):
        inicio = time.monotonic()
        texto = explicar(h, lineas, lenguaje, settings.OLLAMA_DEFAULT_MODEL)
        dt = time.monotonic() - inicio
        total += dt
        cantidad += 1
        origen = "TABLA" if texto == h.descripcion else "IA"
        print(f"  línea {h.linea_codigo} {h.regla} ({h.tipo}/{h.severidad}) [{origen}, {dt:.1f}s]")
        print(f"    {lineas[h.linea_codigo - 1].strip()[:90]}")
        print(f"    -> {texto}")
print(f"\n{cantidad} hallazgos · {total:.0f}s en total · {total / max(cantidad, 1):.1f}s por hallazgo")