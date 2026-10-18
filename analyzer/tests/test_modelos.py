from types import SimpleNamespace

import httpx
import pytest

from app.services import modelos


def _transport(instalados=None):
    def h(req):
        if req.url.path == "/api/tags":
            return httpx.Response(200, json={"models": [{"name": n} for n in (instalados or [])]})
        if req.url.path == "/api/pull":
            return httpx.Response(
                200,
                content=b'{"status":"pulling","total":100,"completed":50}\n'
                b'{"status":"pulling","total":100,"completed":100}\n{"status":"success"}\n',
            )
        return httpx.Response(404)

    return httpx.MockTransport(h)


@pytest.fixture(autouse=True)
def _limpio(monkeypatch):
    modelos._descargas.clear()
    monkeypatch.setattr(modelos, "settings", SimpleNamespace(MODELOS_PERMITIDOS=["llama3", "qwen2.5-coder"]))


def test_listar_incluye_permitidos():
    r = modelos.listar(_transport(["qwen2.5-coder:latest"]))
    assert r == {"instalados": ["qwen2.5-coder:latest"], "permitidos": ["llama3", "qwen2.5-coder"]}


def test_modelo_no_permitido():
    with pytest.raises(modelos.ModeloNoPermitidoError) as e:
        modelos.iniciar_instalacion("gpt-raro", _transport())
    assert e.value.codigo == "MODELO_NO_PERMITIDO"


def test_ya_instalado_devuelve_200():
    status, body = modelos.iniciar_instalacion("qwen2.5-coder", _transport(["qwen2.5-coder:latest"]))
    assert status == 200 and body["estado"] == "completado"


def test_descarga_completa():
    t = _transport([])
    status, _ = modelos.iniciar_instalacion("llama3", t, sincrono=True)
    assert status == 202
    est = modelos.consultar_instalacion("llama3", t)
    assert est["estado"] == "completado"
    assert est["progreso"] == {"completado": 100, "total": 100}


def test_sin_descarga_registrada_es_404():
    with pytest.raises(modelos.DescargaNoEncontradaError):
        modelos.consultar_instalacion("llama3", _transport([]))