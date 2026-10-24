import os
import time
from collections import Counter

from app.core.config import settings
from app.schemas.analisis import SalidaEscaneo
from app.services.file_scanner import RutaInexistenteError
from app.utils.extensions import clasificar


def escanear_lenguajes(
    ruta_base: str,
    max_archivos: int | None = None,
    max_segundos: float | None = None,
) -> SalidaEscaneo:
    if not os.path.isdir(ruta_base):
        raise RutaInexistenteError(ruta_base)

    max_archivos = settings.ESCANEO_MAX_ARCHIVOS if max_archivos is None else max_archivos
    max_segundos = settings.ESCANEO_MAX_SEGUNDOS if max_segundos is None else max_segundos
    ignorados = set(settings.IGNORED_DIRS)
    limite = time.monotonic() + max_segundos

    soportados: Counter[str] = Counter()
    no_soportados: Counter[str] = Counter()
    total = 0
    truncado = False

    for _raiz, dirs, nombres in os.walk(ruta_base):
        dirs[:] = [d for d in dirs if d not in ignorados]  # poda: no entra
        for nombre in nombres:
            if total >= max_archivos or time.monotonic() > limite:
                truncado = True
                break
            total += 1
            clase = clasificar(nombre)
            if clase is None:
                continue  # .txt, .json, imágenes...: no ensucian el resultado
            lenguaje, soportado = clase
            (soportados if soportado else no_soportados)[lenguaje] += 1
        if truncado:
            break

    return SalidaEscaneo(
        soportados=dict(soportados.most_common()),
        no_soportados=dict(no_soportados.most_common()),
        total_archivos=total,
        truncado=truncado,
    )