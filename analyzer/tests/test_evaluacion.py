from app.services.reglas import analizar
from tests.corpus_evaluacion import CASOS
from tests.evaluacion import medir


def _detectado(caso):
    return {(h.regla, h.linea_codigo) for h in analizar(caso.codigo, caso.lenguaje)}


def test_el_corpus_no_tiene_nombres_repetidos():
    nombres = [c.nombre for c in CASOS]
    assert len(nombres) == len(set(nombres))


def test_los_casos_seguros_sin_limite_no_generan_hallazgos():
    for caso in CASOS:
        if not caso.esperado and caso.limite is None:
            assert _detectado(caso) == set(), caso.nombre


def test_los_casos_vulnerables_sin_limite_se_detectan_exactamente():
    for caso in CASOS:
        if caso.esperado and caso.limite is None:
            assert _detectado(caso) == caso.esperado, caso.nombre


def test_todo_fallo_del_corpus_esta_documentado_como_limite():
    sin_documentar = [caso.nombre for caso, _fp, _fn in medir()["detalle"] if caso.limite is None]
    assert sin_documentar == []


def test_metricas_minimas():
    t = medir()["total"]
    assert t["precision"] >= 0.9 and t["recall"] >= 0.8