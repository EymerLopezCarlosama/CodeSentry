from types import SimpleNamespace

import pytest

from app.schemas.analisis import EntradaAnalisis
from app.services import analyzer, explicacion, ollama_client


@pytest.fixture(autouse=True)
def _base(monkeypatch):
    analyzer._trabajos.clear()
    monkeypatch.setattr(ollama_client, "listar_modelos", lambda transport=None: ["qwen2.5-coder:latest"])
    # por defecto la IA "no aporta": devuelve la descripción fija (nunca se llama a un Ollama real)
    monkeypatch.setattr(explicacion, "explicar", lambda h, lineas, lenguaje, modelo: h.descripcion)


@pytest.fixture
def proyecto(tmp_path):
    (tmp_path / "a.js").write_text("eval(x);\nconst a = 1;")
    (tmp_path / "b.py").write_text("subprocess.run(c, shell=True)")
    (tmp_path / "main.go").write_text("package main")
    return tmp_path


def _entrada(ruta, objetivo="carpeta", rel=None):
    return EntradaAnalisis(
        ruta_base=str(ruta), objetivo=objetivo, ruta_relativa=rel, modelo="qwen2.5-coder", lenguajes=["js", "ts", "py"]
    )


def _correr(ruta, objetivo="carpeta", rel=None):
    return analyzer.consultar(analyzer.crear_trabajo(_entrada(ruta, objetivo, rel), sincrono=True))


def _ia(monkeypatch, fn):
    monkeypatch.setattr(explicacion, "explicar", fn)


def _ajustes(monkeypatch, maximo=25, segundos=300):
    monkeypatch.setattr(
        analyzer, "settings", SimpleNamespace(EXPLICACIONES_MAX=maximo, EXPLICACIONES_SEGUNDOS=segundos)
    )


def test_las_reglas_funcionan_sin_modelo(proyecto, monkeypatch):
    monkeypatch.setattr(ollama_client, "listar_modelos", lambda transport=None: [])
    s = _correr(proyecto)
    assert s.estado == "completado"
    assert sorted((h.ruta_relativa, h.linea_codigo, h.tipo, h.severidad) for h in s.resultados) == [
        ("a.js", 1, "vulnerabilidad", "critica"),
        ("b.py", 1, "vulnerabilidad", "critica"),
    ]
    assert s.explicaciones_ia == 0
    assert all(len(h.descripcion) > 20 for h in s.resultados)
    assert (s.progreso.procesados, s.progreso.total) == (2, 2)
    assert [o.ruta_relativa for o in s.omitidos] == ["main.go"]


def test_con_ollama_apagado_el_analisis_no_falla(proyecto, monkeypatch):
    def apagado(transport=None):
        raise ollama_client.OllamaNoDisponibleError("sin conexión")

    monkeypatch.setattr(ollama_client, "listar_modelos", apagado)
    s = _correr(proyecto)
    assert s.estado == "completado" and len(s.resultados) == 2 and s.explicaciones_ia == 0


def test_con_ia_la_explicacion_reemplaza_la_descripcion(proyecto, monkeypatch):
    _ia(monkeypatch, lambda h, lineas, lenguaje, modelo: f"Explicación de la IA para {h.regla}.")
    s = _correr(proyecto)
    assert sorted(h.descripcion for h in s.resultados) == [
        "Explicación de la IA para cmd-shell.",
        "Explicación de la IA para eval.",
    ]
    assert s.explicaciones_ia == 2
    assert (s.progreso.procesados, s.progreso.total) == (4, 4)  # 2 archivos + 2 explicaciones


def test_si_ollama_se_cae_a_mitad_el_resto_usa_la_tabla(proyecto, monkeypatch):
    llamadas = []

    def falso(h, lineas, lenguaje, modelo):
        llamadas.append(h.regla)
        if len(llamadas) == 2:
            raise ollama_client.OllamaNoDisponibleError("se cayó")
        return "Explicación de la IA para la primera."

    _ia(monkeypatch, falso)
    s = _correr(proyecto)
    por_archivo = {h.ruta_relativa: h.descripcion for h in s.resultados}
    assert por_archivo["a.js"] == "Explicación de la IA para la primera."
    assert por_archivo["b.py"] != por_archivo["a.js"] and len(por_archivo["b.py"]) > 20
    assert s.explicaciones_ia == 1
    assert (s.progreso.procesados, s.progreso.total) == (4, 4)


def test_el_tope_explica_primero_lo_mas_grave(tmp_path, monkeypatch):
    (tmp_path / "a.js").write_text("if (a == b) {}\neval(x);")  # línea 1: baja, línea 2: crítica
    _ajustes(monkeypatch, maximo=1)
    _ia(monkeypatch, lambda h, lineas, lenguaje, modelo: "Explicación de la IA.")
    s = _correr(tmp_path)
    por_linea = {h.linea_codigo: h.descripcion for h in s.resultados}
    assert por_linea[2] == "Explicación de la IA."
    assert por_linea[1] != "Explicación de la IA."
    assert s.explicaciones_ia == 1
    assert (s.progreso.procesados, s.progreso.total) == (2, 2)  # 1 archivo + 1 explicación


def test_con_el_interruptor_en_cero_no_se_usa_la_ia(proyecto, monkeypatch):
    def no_debe_llamarse(*args, **kwargs):
        raise AssertionError("no debería usarse la IA")

    _ajustes(monkeypatch, maximo=0)
    monkeypatch.setattr(ollama_client, "listar_modelos", no_debe_llamarse)
    _ia(monkeypatch, no_debe_llamarse)
    s = _correr(proyecto)
    assert s.estado == "completado" and len(s.resultados) == 2 and s.explicaciones_ia == 0


def test_se_deja_la_ia_tras_tres_respuestas_inutiles_seguidas(tmp_path, monkeypatch):
    (tmp_path / "a.js").write_text("\n".join(["eval(x);"] * 5))
    llamadas = []

    def inutil(h, lineas, lenguaje, modelo):
        llamadas.append(1)
        return h.descripcion

    _ia(monkeypatch, inutil)
    s = _correr(tmp_path)
    assert len(llamadas) == 3
    assert len(s.resultados) == 5 and s.explicaciones_ia == 0
    assert s.progreso.procesados == s.progreso.total == 6


def test_el_presupuesto_de_tiempo_corta_las_explicaciones(proyecto, monkeypatch):
    def no_debe_llamarse(*args, **kwargs):
        raise AssertionError("el presupuesto ya se agotó")

    _ajustes(monkeypatch, segundos=-1)
    _ia(monkeypatch, no_debe_llamarse)
    s = _correr(proyecto)
    assert s.estado == "completado" and len(s.resultados) == 2 and s.explicaciones_ia == 0


def test_un_archivo_ilegible_va_a_errores_y_el_resto_sigue(proyecto, monkeypatch):
    (proyecto / "a.js").write_bytes(b"\xff\xfe\x00 no es utf-8")
    s = _correr(proyecto)
    assert s.estado == "completado"
    assert [(e.ruta_relativa, e.motivo) for e in s.errores] == [("a.js", "no se pudo leer el archivo")]
    assert [h.ruta_relativa for h in s.resultados] == ["b.py"]


def test_si_ningun_archivo_se_puede_leer_el_analisis_falla(tmp_path):
    (tmp_path / "a.js").write_bytes(b"\xff\xfe\x00 no es utf-8")
    s = _correr(tmp_path)
    assert s.estado == "fallido" and s.resultados == []


def test_objetivo_archivo_analiza_solo_ese(proyecto):
    s = _correr(proyecto, "archivo", "b.py")
    assert [h.ruta_relativa for h in s.resultados] == ["b.py"]


def test_job_desconocido():
    with pytest.raises(analyzer.JobNoEncontradoError):
        analyzer.consultar("no-existe")