import httpx
import pytest

from app.services.ollama_client import (
    ModeloNoInstaladoError,
    OllamaNoDisponibleError,
    generar,
    listar_modelos,
)


def _t(handler):
    return httpx.MockTransport(handler)


def test_listar_modelos_parsea_tags():
    def h(req):
        assert req.url.path == "/api/tags"
        return httpx.Response(200, json={"models": [{"name": "qwen2.5-coder:latest"}, {"name": "llama3:8b"}]})

    assert listar_modelos(transport=_t(h)) == ["qwen2.5-coder:latest", "llama3:8b"]


def test_generar_devuelve_texto():
    def h(req):
        assert req.url.path == "/api/generate"
        return httpx.Response(200, json={"response": "[]", "done": True})

    assert generar("qwen2.5-coder", "hola", transport=_t(h)) == "[]"


def test_conexion_rechazada():
    def h(req):
        raise httpx.ConnectError("rechazada")

    with pytest.raises(OllamaNoDisponibleError) as e:
        generar("qwen2.5-coder", "hola", transport=_t(h))
    assert e.value.codigo == "OLLAMA_NO_DISPONIBLE" and e.value.status == 503


def test_modelo_inexistente():
    def h(req):
        return httpx.Response(404, json={"error": "model 'x' not found"})

    with pytest.raises(ModeloNoInstaladoError) as e:
        generar("x", "hola", transport=_t(h))
    assert e.value.codigo == "MODELO_NO_INSTALADO" and e.value.status == 400