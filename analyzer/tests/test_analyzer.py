from types import SimpleNamespace

import pytest

from app.schemas.analisis import EntradaAnalisis
from app.services import analyzer, ollama_client

VALIDO = '[{"tipo":"mala_practica","descripcion":"Usar const.","severidad":"baja","linea_codigo":1}]'


@pytest.fixture(autouse=True)
def _base(monkeypatch):
    analyzer._trabajos.clear()
    monkeypatch.setattr(ollama_client, "listar_modelos", lambda transport=None: ["qwen2.5-coder:latest"])


@pytest.fixture
def proyecto(tmp_path):
    (tmp_path / "a.js").write_text("a\nb\nc")
    (tmp_path / "b.py").write_text("x = 1")
    (tmp_path / "main.go").write_text("package main")
    return tmp_path


def _entrada(ruta, objetivo="carpeta", rel=None):
    return EntradaAnalisis(
        ruta_base=str(ruta), objetivo=objetivo, ruta_relativa=rel, modelo="qwen2.5-coder", lenguajes=["js", "ts", "py"]
    )


def _generar(monkeypatch, fn):
    monkeypatch.setattr(ollama_client, "generar", fn)


def test_completa_con_resultados_y_progreso(proyecto, monkeypatch):
    _generar(monkeypatch, lambda modelo, prompt, transport=None: VALIDO)
    s = analyzer.consultar(analyzer.crear_trabajo(_entrada(proyecto), sincrono=True))
    assert s.estado == "completado"
    assert (s.progreso.procesados, s.progreso.total) == (2, 2)
    assert sorted(h.ruta_relativa for h in s.resultados) == ["a.js", "b.py"]
    assert [o.ruta_relativa for o in s.omitidos] == ["main.go"]


def test_json_invalido_reintenta_y_va_a_errores(proyecto, monkeypatch):
    llamadas = []
    _generar(monkeypatch, lambda m, p, transport=None: llamadas.append(p) or "esto no es json")
    s = analyzer.consultar(analyzer.crear_trabajo(_entrada(proyecto, "archivo", "a.js"), sincrono=True))
    assert len(llamadas) == 3
    assert s.estado == "fallido"
    assert "inválida" in s.errores[0].motivo


def test_reintento_usa_prompt_estricto(proyecto, monkeypatch):
    prompts = []

    def fake(m, p, transport=None):
        prompts.append(p)
        return "basura" if len(prompts) == 1 else VALIDO

    _generar(monkeypatch, fake)
    s = analyzer.consultar(analyzer.crear_trabajo(_entrada(proyecto, "archivo", "a.js"), sincrono=True))
    assert s.estado == "completado" and len(s.resultados) == 1
    assert "sin texto fuera del JSON" not in prompts[0]
    assert "sin texto fuera del JSON" in prompts[1]


def test_normalizacion(proyecto, monkeypatch):
    envuelto = (
        '{"hallazgos":['
        '{"tipo":"vulnerabilidad","descripcion":"x","severidad":"alta","linea_codigo":999},'
        '{"tipo":"raro","descripcion":"y","severidad":"alta","linea_codigo":1},'
        '{"tipo":"mala_practica","descripcion":"z","severidad":"grave","linea_codigo":1}]}'
    )
    _generar(monkeypatch, lambda m, p, transport=None: envuelto)
    s = analyzer.consultar(analyzer.crear_trabajo(_entrada(proyecto, "archivo", "a.js"), sincrono=True))
    assert len(s.resultados) == 1  # tipo y severidad desconocidos descartados
    assert s.resultados[0].linea_codigo == 3  # 999 ajustado al total de líneas (3)


def test_bloques_con_offset(tmp_path, monkeypatch):
    (tmp_path / "c.py").write_text("x = 1\n" * 450)
    prompts = []
    _generar(monkeypatch, lambda m, p, transport=None: prompts.append(p) or "[]")
    s = analyzer.consultar(analyzer.crear_trabajo(_entrada(tmp_path, "archivo", "c.py"), sincrono=True))
    assert s.estado == "completado"
    assert len(prompts) == 3
    assert "201 | " in prompts[1] and "401 | " in prompts[2]


def test_job_desconocido():
    with pytest.raises(analyzer.JobNoEncontradoError):
        analyzer.consultar("no-existe")


def test_modelo_no_instalado(proyecto, monkeypatch):
    monkeypatch.setattr(ollama_client, "listar_modelos", lambda transport=None: [])
    with pytest.raises(ollama_client.ModeloNoInstaladoError):
        analyzer.crear_trabajo(_entrada(proyecto), sincrono=True)


def test_un_archivo_falla_y_el_resto_sigue(proyecto, monkeypatch):
    def fake(m, p, transport=None):
        if "Python" in p:
            raise ollama_client.OllamaError("boom")
        return VALIDO

    _generar(monkeypatch, fake)
    s = analyzer.consultar(analyzer.crear_trabajo(_entrada(proyecto), sincrono=True))
    assert s.estado == "completado"  # al menos uno se analizó
    assert [e.ruta_relativa for e in s.errores] == ["b.py"]
    assert len(s.resultados) == 1


def test_tiempo_limite_por_archivo(proyecto, monkeypatch):
    monkeypatch.setattr(
        analyzer, "settings", SimpleNamespace(TIMEOUT_ARCHIVO=-1, TAMANO_BLOQUE=200, MAX_REINTENTOS=3)
    )
    s = analyzer.consultar(analyzer.crear_trabajo(_entrada(proyecto, "archivo", "a.js"), sincrono=True))
    assert s.estado == "fallido"
    assert "tiempo límite" in s.errores[0].motivo