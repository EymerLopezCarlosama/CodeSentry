import httpx

from app.core.config import settings


class OllamaError(Exception):
    codigo = "ERROR_OLLAMA"
    status = 500


class OllamaNoDisponibleError(OllamaError):
    codigo = "OLLAMA_NO_DISPONIBLE"
    status = 503


class ModeloNoInstaladoError(OllamaError):
    codigo = "MODELO_NO_INSTALADO"
    status = 400


class OllamaTiempoExcedidoError(OllamaError):
    """Interno: el analyzer lo manda a `errores` del archivo (regla 7)."""

    codigo = "OLLAMA_TIEMPO_EXCEDIDO"
    status = 504


def _cliente(timeout: float, transport: httpx.BaseTransport | None) -> httpx.Client:
    return httpx.Client(base_url=settings.OLLAMA_URL, timeout=timeout, transport=transport)


def listar_modelos(transport: httpx.BaseTransport | None = None) -> list[str]:
    """GET /api/tags -> nombres de modelos instalados."""
    try:
        with _cliente(10, transport) as c:
            r = c.get("/api/tags")
            r.raise_for_status()
            return [m["name"] for m in r.json().get("models", [])]
    except (httpx.ConnectError, httpx.ConnectTimeout) as e:
        raise OllamaNoDisponibleError(str(e)) from e
    except httpx.HTTPError as e:
        raise OllamaError(str(e)) from e


def generar(modelo: str, prompt: str, transport: httpx.BaseTransport | None = None) -> str:
    """POST /api/generate (stream=false, format=json) -> texto de la respuesta."""
    cuerpo = {"model": modelo, "prompt": prompt, "stream": False, "format": "json"}
    try:
        with _cliente(settings.TIMEOUT_ARCHIVO, transport) as c:
            r = c.post("/api/generate", json=cuerpo)
    except (httpx.ConnectError, httpx.ConnectTimeout) as e:
        raise OllamaNoDisponibleError(str(e)) from e
    except httpx.TimeoutException as e:
        raise OllamaTiempoExcedidoError(str(e)) from e
    except httpx.HTTPError as e:
        raise OllamaError(str(e)) from e

    if r.status_code == 404:  # Ollama: {"error": "model 'x' not found"}
        raise ModeloNoInstaladoError(modelo)
    if r.status_code >= 400:
        raise OllamaError(f"Ollama respondió {r.status_code}")
    return r.json().get("response", "")