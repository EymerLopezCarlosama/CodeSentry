"""Orquestador del análisis (asíncrono).

1. Reglas estáticas sobre cada archivo (sin IA): dan la línea, el tipo y la severidad.
2. La IA local redacta una explicación para los hallazgos más graves; el resto (o todos, si Ollama no está disponible) usa la descripción fija de la tabla. Un análisis nunca falla por culpa de la IA.
Solo lectura: nunca escribe ni ejecuta nada del proyecto analizado.
"""

import logging
import os
import threading
import time
import uuid
from dataclasses import dataclass

from app.core.config import settings
from app.schemas.analisis import EntradaAnalisis, ErrorArchivo, Hallazgo, Progreso, SalidaAnalisis
from app.services import explicacion, file_scanner, ollama_client
from app.services.reglas import HallazgoRegla, analizar
from app.utils.extensions import lenguaje_de

registro = logging.getLogger(__name__)

ORDEN_SEVERIDAD = {"critica": 0, "alta": 1, "media": 2, "baja": 3}
FALLOS_SEGUIDOS_MAX = 3  # tras tantas explicaciones inútiles seguidas se deja de usar la IA

_trabajos: dict[str, SalidaAnalisis] = {}
_lock = threading.Lock()


class JobNoEncontradoError(Exception):
    codigo = "JOB_NO_ENCONTRADO"
    status = 404


@dataclass
class _Pendiente:
    ruta: str
    lenguaje: str
    lineas: list[str]
    hallazgo: HallazgoRegla
    texto: str  # descripción fija; se reemplaza si la IA explica
    por_ia: bool = False


def _analizar_archivo(ruta_base: str, rel: str) -> tuple[str, list[str], list[HallazgoRegla]]:
    with open(os.path.join(ruta_base, rel), encoding="utf-8") as f:
        codigo = f.read()
    lenguaje = lenguaje_de(rel) or ""
    return lenguaje, codigo.splitlines(), analizar(codigo, lenguaje)


def _motivo(e: Exception) -> str:
    if isinstance(e, (OSError, UnicodeDecodeError)):
        return "no se pudo leer el archivo"
    return "error inesperado"


def _explicar(job: SalidaAnalisis, pendientes: list[_Pendiente], modelo: str) -> None:
    orden = sorted(
        pendientes,
        key=lambda p: (ORDEN_SEVERIDAD.get(p.hallazgo.severidad, 9), p.ruta, p.hallazgo.linea_codigo),
    )
    limite = time.monotonic() + settings.EXPLICACIONES_SEGUNDOS
    seguidos = 0
    for p in orden[: settings.EXPLICACIONES_MAX]:
        if time.monotonic() > limite:
            break
        try:
            texto = explicacion.explicar(p.hallazgo, p.lineas, p.lenguaje, modelo)
        except ollama_client.OllamaNoDisponibleError:
            break  # Ollama se cayó: el resto queda con la descripción fija
        except Exception:
            registro.exception("Falló la explicación de %s:%s", p.ruta, p.hallazgo.linea_codigo)
            texto = p.texto
        if texto != p.texto:
            p.texto, p.por_ia = texto, True
            seguidos = 0
        else:
            seguidos += 1
            if seguidos >= FALLOS_SEGUIDOS_MAX:
                break
        with _lock:
            job.progreso.procesados += 1


def _ejecutar(job_id: str, entrada: EntradaAnalisis, archivos: list[str], usar_ia: bool) -> None:
    job = _trabajos[job_id]
    pendientes: list[_Pendiente] = []
    analizados = 0
    try:
        for rel in archivos:
            try:
                lenguaje, lineas, encontrados = _analizar_archivo(entrada.ruta_base, rel)
                pendientes.extend(_Pendiente(rel, lenguaje, lineas, h, h.descripcion) for h in encontrados)
                analizados += 1
            except Exception as e:  # un archivo malo no tumba el análisis
                with _lock:
                    job.errores.append(ErrorArchivo(ruta_relativa=rel, motivo=_motivo(e)))
            with _lock:
                job.progreso.procesados += 1

        a_explicar = min(len(pendientes), settings.EXPLICACIONES_MAX) if usar_ia else 0
        if a_explicar > 0:
            with _lock:
                job.progreso.total += a_explicar
            try:
                _explicar(job, pendientes, entrada.modelo)
            except Exception:
                registro.exception("Falló la fase de explicaciones; se usan las descripciones fijas")

        with _lock:
            job.resultados.extend(
                Hallazgo(
                    ruta_relativa=p.ruta,
                    tipo=p.hallazgo.tipo,
                    severidad=p.hallazgo.severidad,
                    linea_codigo=p.hallazgo.linea_codigo,
                    descripcion=p.texto,
                )
                for p in pendientes
            )
            job.explicaciones_ia = sum(1 for p in pendientes if p.por_ia)
    finally:
        with _lock:
            job.progreso.procesados = job.progreso.total
            job.estado = "completado" if analizados > 0 else "fallido"


def _ia_disponible(modelo: str) -> bool:
    """¿Se pueden pedir explicaciones? Falso si están desactivadas, Ollama está apagado o falta el modelo."""
    if settings.EXPLICACIONES_MAX <= 0:
        return False
    try:
        instalados = ollama_client.listar_modelos()
    except ollama_client.OllamaError:
        return False
    return modelo in instalados or f"{modelo}:latest" in instalados


def crear_trabajo(entrada: EntradaAnalisis, sincrono: bool = False) -> str:
    archivos, omitidos = file_scanner.escanear(
        entrada.ruta_base, entrada.objetivo, entrada.ruta_relativa, list(entrada.lenguajes)
    )
    usar_ia = _ia_disponible(entrada.modelo)

    job_id = uuid.uuid4().hex[:12]
    with _lock:
        _trabajos[job_id] = SalidaAnalisis(
            estado="en_proceso", progreso=Progreso(procesados=0, total=len(archivos)), omitidos=omitidos
        )
    if sincrono:
        _ejecutar(job_id, entrada, archivos, usar_ia)
    else:
        threading.Thread(target=_ejecutar, args=(job_id, entrada, archivos, usar_ia), daemon=True).start()
    return job_id


def consultar(job_id: str) -> SalidaAnalisis:
    with _lock:
        if job_id not in _trabajos:
            raise JobNoEncontradoError(job_id)
        return _trabajos[job_id].model_copy(deep=True)