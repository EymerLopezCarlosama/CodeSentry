import threading

from app.core.config import settings
from app.services import ollama_client

_descargas: dict[str, dict] = {}
_lock = threading.Lock()


class ModeloNoPermitidoError(Exception):
    codigo = "MODELO_NO_PERMITIDO"
    status = 400


class DescargaNoEncontradaError(Exception):
    codigo = "DESCARGA_NO_ENCONTRADA"
    status = 404


def _instalado(modelo: str, instalados: list[str]) -> bool:
    return modelo in instalados or f"{modelo}:latest" in instalados


def _copia(modelo: str) -> dict:
    d = _descargas[modelo]
    return {**d, "progreso": dict(d["progreso"])}


def listar(transport=None) -> dict:
    return {
        "instalados": ollama_client.listar_modelos(transport),
        "permitidos": list(settings.MODELOS_PERMITIDOS),
    }


def _descargar(modelo: str, transport) -> None:
    def progreso(completado: int, total: int) -> None:
        with _lock:
            _descargas[modelo]["progreso"] = {"completado": completado, "total": total}

    try:
        ollama_client.descargar(modelo, progreso, transport)
        with _lock:
            _descargas[modelo]["estado"] = "completado"
    except Exception as e:  # cualquier fallo queda registrado, no tumba el hilo
        with _lock:
            _descargas[modelo].update(estado="fallido", motivo=str(e))


def iniciar_instalacion(modelo: str, transport=None, sincrono: bool = False) -> tuple[int, dict]:
    if modelo not in settings.MODELOS_PERMITIDOS:
        raise ModeloNoPermitidoError(modelo)
    if _instalado(modelo, ollama_client.listar_modelos(transport)):
        with _lock:
            _descargas[modelo] = {"modelo": modelo, "estado": "completado", "progreso": {"completado": 0, "total": 0}}
            return 200, _copia(modelo)
    with _lock:
        actual = _descargas.get(modelo)
        if actual and actual["estado"] == "descargando":
            return 202, _copia(modelo)  # idempotente
        _descargas[modelo] = {"modelo": modelo, "estado": "descargando", "progreso": {"completado": 0, "total": 0}}
    if sincrono:
        _descargar(modelo, transport)
    else:
        threading.Thread(target=_descargar, args=(modelo, transport), daemon=True).start()
    with _lock:
        return 202, _copia(modelo)


def consultar_instalacion(modelo: str, transport=None) -> dict:
    with _lock:
        if modelo in _descargas:
            return _copia(modelo)
    if _instalado(modelo, ollama_client.listar_modelos(transport)):
        return {"modelo": modelo, "estado": "completado", "progreso": {"completado": 0, "total": 0}}
    raise DescargaNoEncontradaError(modelo)