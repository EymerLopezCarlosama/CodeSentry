import pytest

from app.utils.extensions import clasificar, es_soportado, lenguaje_de


@pytest.mark.parametrize(
    "ruta,esperado",
    [("a.js", "JavaScript"), ("src/b.ts", "TypeScript"), ("c.py", "Python"), ("MAIN.PY", "Python")],
)
def test_soportados(ruta, esperado):
    assert clasificar(ruta) == (esperado, True)


@pytest.mark.parametrize(
    "ruta,esperado",
    [("App.java", "Java"), ("index.php", "PHP"), ("main.go", "Go"), ("x.tsx", "TypeScript (TSX)"), ("q.sql", "SQL")],
)
def test_conocidos_fuera_de_alcance(ruta, esperado):
    assert clasificar(ruta) == (esperado, False)


@pytest.mark.parametrize("ruta", ["notas.txt", "datos.json", "README.md", "logo.png", "Dockerfile"])
def test_no_es_codigo_reconocible(ruta):
    assert clasificar(ruta) is None


def test_funciones_previas_siguen_igual():
    assert lenguaje_de("a.js") == "js"
    assert lenguaje_de("a.java") is None
    assert es_soportado("x.py") and not es_soportado("x.go")