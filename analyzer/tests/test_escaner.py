import pytest

from app.services.escaner import escanear_lenguajes
from app.services.file_scanner import RutaInexistenteError


@pytest.fixture
def proyecto(tmp_path):
    for nombre in ("a.js", "b.js", "c.ts", "d.py", "App.java", "x.php", "y.php", "z.php", "notas.txt", "datos.json"):
        (tmp_path / nombre).write_text("x")
    nm = tmp_path / "node_modules"
    nm.mkdir()
    (nm / "lib.js").write_text("x")
    (nm / "Otro.java").write_text("x")
    return tmp_path


def test_cuenta_soportados_y_no_soportados(proyecto):
    r = escanear_lenguajes(str(proyecto))
    assert r.soportados == {"JavaScript": 2, "TypeScript": 1, "Python": 1}
    assert r.no_soportados == {"PHP": 3, "Java": 1}
    assert r.truncado is False


def test_node_modules_se_ignora(proyecto):
    r = escanear_lenguajes(str(proyecto))
    assert r.soportados["JavaScript"] == 2  # no suma node_modules/lib.js
    assert r.no_soportados["Java"] == 1  # no suma node_modules/Otro.java
    assert r.total_archivos == 10


def test_lo_que_no_es_codigo_no_aparece(proyecto):
    r = escanear_lenguajes(str(proyecto))
    todo = {**r.soportados, **r.no_soportados}
    assert not any(k.lower() in ("txt", "json", "texto") for k in todo)
    assert sum(todo.values()) == 8  # 10 archivos menos notas.txt y datos.json


def test_tope_de_archivos_marca_truncado(proyecto):
    r = escanear_lenguajes(str(proyecto), max_archivos=3)
    assert r.truncado is True
    assert r.total_archivos == 3


def test_tope_exacto_no_marca_truncado(proyecto):
    r = escanear_lenguajes(str(proyecto), max_archivos=10)
    assert r.truncado is False
    assert r.total_archivos == 10


def test_tope_de_tiempo_marca_truncado(proyecto):
    r = escanear_lenguajes(str(proyecto), max_segundos=-1)
    assert r.truncado is True


def test_ruta_inexistente(tmp_path):
    with pytest.raises(RutaInexistenteError) as e:
        escanear_lenguajes(str(tmp_path / "no_existe"))
    assert e.value.codigo == "RUTA_INEXISTENTE" and e.value.status == 400