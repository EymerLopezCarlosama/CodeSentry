import os

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.prompts import documentacion as prompt
from app.schemas.documentacion import EntradaDocumentacion
from app.services import doc_generator, ollama_client
from app.services.archivo_fuente import ArchivoError

DOC_PY = (
    "# calc.py\n\n## Resumen\nSuma números enteros.\n\n## Documentación propuesta\n"
    'suma\n```python\ndef suma(a, b):\n    """Suma dos números.\n\n    Args:\n        a: primer número\n    """\n```\n'
)
DOC_JS = "# calc.js\n\n## Resumen\nSuma dos números.\n\n## Documentación propuesta\nsuma\n```js\n/** Suma dos números. @param {number} a */\n```\n"


@pytest.fixture
def proyecto(tmp_path):
    (tmp_path / "calc.py").write_text("def suma(a, b):\n    return a + b\n")
    (tmp_path / "calc.js").write_text("function suma(a, b) { return a + b; }\n")
    (tmp_path / "notas.txt").write_text("hola")
    return tmp_path


def _generar(monkeypatch, respuestas):
    prompts = []
    it = iter(respuestas)

    def falso(modelo, texto, **opciones):
        prompts.append(texto)
        return next(it)

    monkeypatch.setattr(ollama_client, "generar", falso)
    return prompts


def _entrada(ruta, rel):
    return EntradaDocumentacion(ruta_base=str(ruta), ruta_relativa=rel, modelo="m")


# ---------- prompt ----------

def test_prompt_python_pide_docstrings():
    p = prompt.construir_prompt("def a(): pass", "py", "a.py")
    assert "docstrings de Python" in p and "## Resumen" in p and "## Documentación propuesta" in p
    assert "No modifiques la lógica" in p and "def a(): pass" in p


def test_prompt_js_y_ts_piden_jsdoc():
    for lenguaje in ("js", "ts"):
        assert "JSDoc" in prompt.construir_prompt("function a() {}", lenguaje, "a.js")


def test_prompt_estricto_insiste_en_el_formato():
    assert "no tenía el formato pedido" in prompt.construir_prompt("x", "py", "a.py", estricto=True)
    assert "no tenía el formato pedido" not in prompt.construir_prompt("x", "py", "a.py")


# ---------- limpieza y validación ----------

def test_limpiar_quita_solo_la_valla_externa():
    envuelto = "```markdown\n" + DOC_PY + "```"
    limpio = doc_generator._limpiar(envuelto)
    assert limpio.startswith("# calc.py") and "```python" in limpio


def test_valido():
    assert doc_generator._valido(DOC_PY)
    assert not doc_generator._valido("Claro, aquí tienes la documentación del archivo.")  # sin título
    assert not doc_generator._valido("# Título")  # demasiado corto


# ---------- generación ----------

def test_genera_documentacion(proyecto, monkeypatch):
    _generar(monkeypatch, [DOC_PY])
    r = doc_generator.generar_documentacion(_entrada(proyecto, "calc.py"))
    assert r.contenido.startswith("# calc.py") and r.aviso is None


def test_reintenta_con_prompt_estricto(proyecto, monkeypatch):
    prompts = _generar(monkeypatch, ["Aquí está la documentación.", DOC_JS])
    r = doc_generator.generar_documentacion(_entrada(proyecto, "calc.js"))
    assert "JSDoc" in r.contenido or "/**" in r.contenido
    assert "no tenía el formato pedido" in prompts[1] and "no tenía el formato pedido" not in prompts[0]


def test_dos_respuestas_invalidas(proyecto, monkeypatch):
    _generar(monkeypatch, ["nada", "tampoco"])
    with pytest.raises(ArchivoError) as e:
        doc_generator.generar_documentacion(_entrada(proyecto, "calc.py"))
    assert e.value.codigo == "RESPUESTA_INVALIDA" and "documentación" in e.value.mensaje


def test_archivo_largo_se_recorta_y_avisa(proyecto, monkeypatch):
    (proyecto / "grande.py").write_text("\n".join(f"x{i} = {i}" for i in range(400)))
    _generar(monkeypatch, [DOC_PY])
    r = doc_generator.generar_documentacion(_entrada(proyecto, "grande.py"))
    assert "400 líneas" in r.aviso and "la documentación se generó" in r.aviso


def test_errores_de_lectura(proyecto, monkeypatch):
    _generar(monkeypatch, [])
    for rel, codigo in [("../x.py", "ARCHIVO_FUERA_DE_RUTA"), ("notas.txt", "LENGUAJE_NO_SOPORTADO"), ("no.py", "ARCHIVO_INEXISTENTE")]:
        with pytest.raises(ArchivoError) as e:
            doc_generator.generar_documentacion(_entrada(proyecto, rel))
        assert e.value.codigo == codigo


def test_nunca_escribe_en_el_proyecto(proyecto, monkeypatch):
    antes = {f: (proyecto / f).read_text() for f in os.listdir(proyecto)}
    _generar(monkeypatch, [DOC_PY])
    doc_generator.generar_documentacion(_entrada(proyecto, "calc.py"))
    assert sorted(os.listdir(proyecto)) == sorted(antes)
    assert all((proyecto / f).read_text() == t for f, t in antes.items())


# ---------- ruta HTTP ----------

def test_ruta_documentacion_ok(proyecto, monkeypatch):
    _generar(monkeypatch, [DOC_PY])
    r = TestClient(app).post("/documentacion", json={"ruta_base": str(proyecto), "ruta_relativa": "calc.py"})
    assert r.status_code == 200 and r.json()["contenido"].startswith("# calc.py")


def test_ruta_documentacion_mensaje_propio_de_documentacion(proyecto):
    r = TestClient(app).post("/documentacion", json={"ruta_base": str(proyecto), "ruta_relativa": "notas.txt"})
    assert r.status_code == 400
    assert r.json()["codigo"] == "LENGUAJE_NO_SOPORTADO" and "documentación" in r.json()["mensaje"]
