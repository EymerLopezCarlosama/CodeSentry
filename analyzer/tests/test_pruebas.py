import os

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.prompts import pruebas as prompt
from app.schemas.pruebas import EntradaPruebas
from app.services import ollama_client, test_generator
from app.services.archivo_fuente import ArchivoError

JEST_VALIDO = 'const { suma } = require("./calc");\ndescribe("suma", () => {\n  test("suma dos", () => {\n    expect(suma(1, 2)).toBe(3);\n  });\n});'
PYTEST_VALIDO = "from calc import suma\n\ndef test_suma():\n    assert suma(1, 2) == 3\n"


@pytest.fixture
def proyecto(tmp_path):
    (tmp_path / "calc.js").write_text("function suma(a, b) { return a + b; }\nmodule.exports = { suma };\n")
    (tmp_path / "util.ts").write_text("export function doble(n: number): number { return n * 2; }\n")
    (tmp_path / "calc.py").write_text("def suma(a, b):\n    return a + b\n")
    (tmp_path / "notas.txt").write_text("hola")
    (tmp_path / "vacio.py").write_text("   \n")
    return tmp_path


def _generar(monkeypatch, respuestas):
    """Reemplaza a Ollama: devuelve las respuestas en orden y guarda los prompts recibidos."""
    prompts = []
    it = iter(respuestas)

    def falso(modelo, texto, **opciones):
        prompts.append(texto)
        return next(it)

    monkeypatch.setattr(ollama_client, "generar", falso)
    return prompts


def _entrada(ruta, rel):
    return EntradaPruebas(ruta_base=str(ruta), ruta_relativa=rel, modelo="m")


# ---------- prompt ----------

def test_prompt_js_usa_jest_y_require_si_es_commonjs():
    p = prompt.construir_prompt("module.exports = { a };", "js", "src/a.js")
    assert "Jest" in p and 'require("./a")' in p


def test_prompt_ts_usa_import():
    p = prompt.construir_prompt("export function a() {}", "ts", "src/a.ts")
    assert 'import { ... } from "./a"' in p


def test_prompt_python_usa_pytest_y_el_modulo():
    p = prompt.construir_prompt("def a(): pass", "py", "pkg/a.py")
    assert "PyTest" in p and "from pkg.a import" in p


def test_prompt_estricto_pide_solo_codigo():
    assert "no contenía pruebas válidas" in prompt.construir_prompt("x", "py", "a.py", estricto=True)
    assert "no contenía pruebas válidas" not in prompt.construir_prompt("x", "py", "a.py")


# ---------- limpieza y validación ----------

def test_limpiar_extrae_el_bloque_de_codigo():
    assert test_generator._limpiar("Aquí va:\n```js\nexpect(1)\n```\nListo") == "expect(1)"
    assert test_generator._limpiar("  def test_a(): pass  ") == "def test_a(): pass"


def test_valido_segun_el_framework():
    assert test_generator._valido(PYTEST_VALIDO, "pytest")
    assert not test_generator._valido("print('hola')", "pytest")
    assert test_generator._valido(JEST_VALIDO, "jest")
    assert not test_generator._valido("const a = 1;", "jest")


# ---------- generación ----------

def test_genera_jest_para_js_y_python_con_pytest(proyecto, monkeypatch):
    _generar(monkeypatch, [JEST_VALIDO])
    r = test_generator.generar_pruebas(_entrada(proyecto, "calc.js"))
    assert r.framework == "jest" and "expect" in r.contenido and r.aviso is None

    _generar(monkeypatch, [PYTEST_VALIDO])
    r = test_generator.generar_pruebas(_entrada(proyecto, "calc.py"))
    assert r.framework == "pytest"


def test_reintenta_con_prompt_estricto_si_la_primera_respuesta_no_sirve(proyecto, monkeypatch):
    prompts = _generar(monkeypatch, ["Claro, aquí tienes una explicación.", JEST_VALIDO])
    r = test_generator.generar_pruebas(_entrada(proyecto, "calc.js"))
    assert r.framework == "jest" and len(prompts) == 2
    assert "no contenía pruebas válidas" in prompts[1] and "no contenía pruebas válidas" not in prompts[0]


def test_dos_respuestas_invalidas_dan_respuesta_invalida(proyecto, monkeypatch):
    _generar(monkeypatch, ["nada", "tampoco"])
    with pytest.raises(ArchivoError) as e:
        test_generator.generar_pruebas(_entrada(proyecto, "calc.js"))
    assert e.value.codigo == "RESPUESTA_INVALIDA" and e.value.status == 502


def test_archivo_largo_se_recorta_y_avisa(proyecto, monkeypatch):
    (proyecto / "grande.py").write_text("\n".join(f"x{i} = {i}" for i in range(500)))
    prompts = _generar(monkeypatch, [PYTEST_VALIDO])
    r = test_generator.generar_pruebas(_entrada(proyecto, "grande.py"))
    assert "500 líneas" in r.aviso and "las pruebas se generaron" in r.aviso
    assert "x299 = 299" in prompts[0] and "x300 = 300" not in prompts[0]


@pytest.mark.parametrize(
    "rel,codigo,status",
    [
        ("../fuera.py", "ARCHIVO_FUERA_DE_RUTA", 400),
        ("notas.txt", "LENGUAJE_NO_SOPORTADO", 400),
        ("no_existe.py", "ARCHIVO_INEXISTENTE", 400),
        ("vacio.py", "ARCHIVO_VACIO", 400),
    ],
)
def test_errores_de_lectura(proyecto, monkeypatch, rel, codigo, status):
    _generar(monkeypatch, [])
    with pytest.raises(ArchivoError) as e:
        test_generator.generar_pruebas(_entrada(proyecto, rel))
    assert e.value.codigo == codigo and e.value.status == status


def test_carpeta_inexistente(tmp_path, monkeypatch):
    _generar(monkeypatch, [])
    with pytest.raises(ArchivoError) as e:
        test_generator.generar_pruebas(_entrada(tmp_path / "no", "a.py"))
    assert e.value.codigo == "RUTA_INEXISTENTE"


def test_nunca_escribe_en_el_proyecto(proyecto, monkeypatch):
    antes = {f: (proyecto / f).read_text() for f in os.listdir(proyecto)}
    _generar(monkeypatch, [JEST_VALIDO])
    test_generator.generar_pruebas(_entrada(proyecto, "calc.js"))
    assert sorted(os.listdir(proyecto)) == sorted(antes)
    assert all((proyecto / f).read_text() == texto for f, texto in antes.items())


# ---------- ruta HTTP ----------

def test_ruta_pruebas_devuelve_codigo_y_mensaje(proyecto):
    r = TestClient(app).post("/pruebas", json={"ruta_base": str(proyecto), "ruta_relativa": "notas.txt"})
    assert r.status_code == 400
    assert r.json()["codigo"] == "LENGUAJE_NO_SOPORTADO" and "pruebas" in r.json()["mensaje"]


def test_ruta_pruebas_ollama_apagado(proyecto, monkeypatch):
    def apagado(*a, **k):
        raise ollama_client.OllamaNoDisponibleError("sin conexión")

    monkeypatch.setattr(ollama_client, "generar", apagado)
    r = TestClient(app).post("/pruebas", json={"ruta_base": str(proyecto), "ruta_relativa": "calc.js"})
    assert r.status_code == 503 and r.json()["codigo"] == "OLLAMA_NO_DISPONIBLE"
