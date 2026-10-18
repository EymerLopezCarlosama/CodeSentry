import json
import os
import threading
import time
import uuid
from typing import get_args

from app.core.config import settings
from app.prompts.analisis import construir_prompt
from app.schemas.analisis import (
    EntradaAnalisis,
    ErrorArchivo,
    Hallazgo,
    Progreso,
    SalidaAnalisis,
    Severidad,
    TipoHallazgo,
)
from app.services import file_scanner, ollama_client
from app.utils.extensions import lenguaje_de

TIPOS = get_args(TipoHallazgo)
SEVERIDADES = get_args(Severidad)

_trabajos: dict[str, SalidaAnalisis] = {}
_lock = threading.Lock()


class JobNoEncontradoError(Exception):
    codigo = "JOB_NO_ENCONTRADO"
    status = 404


class _JsonInvalidoError(Exception):
    pass


def _extraer_lista(texto: str) -> list:
    """Acepta lista directa, objeto envolvente {"x": [...]} u objeto suelto; otra cosa -> ValueError."""
    datos = json.loads(texto)  # JSONDecodeError es subclase de ValueError
    if isinstance(datos, list):
        return datos
    if isinstance(datos, dict):
        for valor in datos.values():
            if isinstance(valor, list):
                return valor
        return [datos] if "tipo" in datos else []
    raise ValueError("JSON no es lista ni objeto")


def _normalizar(item, ruta: str, total_lineas: int) -> Hallazgo | None:
    if not isinstance(item, dict):
        return None
    tipo, sev, desc = item.get("tipo"), item.get("severidad"), item.get("descripcion")
    if tipo not in TIPOS or sev not in SEVERIDADES:
        return None  # regla 5: tipo o severidad desconocidos -> se descarta
    if not isinstance(desc, str) or not desc.strip():
        return None
    try:
        linea = int(item.get("linea_codigo"))
    except (TypeError, ValueError):
        return None
    linea = min(max(linea, 1), max(total_lineas, 1))  # regla 5: se ajusta al rango del archivo
    return Hallazgo(ruta_relativa=ruta, tipo=tipo, severidad=sev, linea_codigo=linea, descripcion=desc.strip())


def _analizar_bloque(bloque: str, lenguaje: str, offset: int, modelo: str, limite: float) -> list:
    for intento in range(1, settings.MAX_REINTENTOS + 1):
        if time.monotonic() > limite:
            raise ollama_client.OllamaTiempoExcedidoError("tiempo límite por archivo")
        texto = ollama_client.generar(modelo, construir_prompt(bloque, lenguaje, offset, estricto=intento > 1))
        try:
            return _extraer_lista(texto)
        except ValueError:
            continue  # reintento con prompt estricto
    raise _JsonInvalidoError()


def _analizar_archivo(ruta_base: str, rel: str, modelo: str) -> list[Hallazgo]:
    with open(os.path.join(ruta_base, rel), encoding="utf-8") as f:
        lineas = f.read().splitlines()
    lenguaje = lenguaje_de(rel)
    limite = time.monotonic() + settings.TIMEOUT_ARCHIVO
    hallazgos: list[Hallazgo] = []
    for offset in range(0, max(len(lineas), 1), settings.TAMANO_BLOQUE):
        bloque = "\n".join(lineas[offset : offset + settings.TAMANO_BLOQUE])
        if not bloque.strip():
            continue
        for item in _analizar_bloque(bloque, lenguaje, offset, modelo, limite):
            h = _normalizar(item, rel, len(lineas))
            if h:
                hallazgos.append(h)
    return hallazgos


def _motivo(e: Exception) -> str:
    if isinstance(e, ollama_client.OllamaTiempoExcedidoError):
        return f"tiempo límite de {settings.TIMEOUT_ARCHIVO} s excedido"
    if isinstance(e, _JsonInvalidoError):
        return f"respuesta JSON inválida tras {settings.MAX_REINTENTOS} intentos"
    if isinstance(e, ollama_client.OllamaError):
        return e.codigo
    if isinstance(e, (OSError, UnicodeDecodeError)):
        return "no se pudo leer el archivo"
    return "error inesperado"


def _ejecutar(job_id: str, entrada: EntradaAnalisis, archivos: list[str]) -> None:
    job = _trabajos[job_id]
    analizados = 0
    try:
        for rel in archivos:
            try:
                hallazgos = _analizar_archivo(entrada.ruta_base, rel, entrada.modelo)
                with _lock:
                    job.resultados.extend(hallazgos)
                analizados += 1
            except Exception as e:  # un archivo malo no tumba el análisis
                with _lock:
                    job.errores.append(ErrorArchivo(ruta_relativa=rel, motivo=_motivo(e)))
            with _lock:
                job.progreso.procesados += 1
    finally:
        with _lock:  # regla 8
            job.estado = "completado" if analizados > 0 else "fallido"


def crear_trabajo(entrada: EntradaAnalisis, sincrono: bool = False) -> str:
    archivos, omitidos = file_scanner.escanear(
        entrada.ruta_base, entrada.objetivo, entrada.ruta_relativa, list(entrada.lenguajes)
    )
    instalados = ollama_client.listar_modelos()
    if entrada.modelo not in instalados and f"{entrada.modelo}:latest" not in instalados:
        raise ollama_client.ModeloNoInstaladoError(entrada.modelo)

    job_id = uuid.uuid4().hex[:12]
    with _lock:
        _trabajos[job_id] = SalidaAnalisis(
            estado="en_proceso", progreso=Progreso(procesados=0, total=len(archivos)), omitidos=omitidos
        )
    if sincrono:
        _ejecutar(job_id, entrada, archivos)
    else:
        threading.Thread(target=_ejecutar, args=(job_id, entrada, archivos), daemon=True).start()
    return job_id


def consultar(job_id: str) -> SalidaAnalisis:
    with _lock:
        if job_id not in _trabajos:
            raise JobNoEncontradoError(job_id)
        return _trabajos[job_id].model_copy(deep=True)