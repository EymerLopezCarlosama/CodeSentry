import pytest

from app.utils.extensions import clasificar, es_soportado, lenguaje_de


@pytest.mark.parametrize(
    "ruta,esperado",
    [("a.js", "JavaScript"), ("src/b.ts", "TypeScript"), ("c.py", "Python"), ("MAIN.PY", "Python"),
    ("App.jsx", "JavaScript"), ("Vista.tsx", "TypeScript")],
)
def test_soportados(ruta, esperado):
    assert clasificar(ruta) == (esperado, True)


@pytest.mark.parametrize(
    "ruta,esperado",
    [("App.java", "Java"), ("index.php", "PHP"), ("main.go", "Go"), ("q.sql", "SQL")],
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
    
def test_react_cuenta_como_js_y_ts():
    assert lenguaje_de("App.jsx") == "js" and lenguaje_de("Vista.tsx") == "ts"
    assert es_soportado("src/App.tsx")