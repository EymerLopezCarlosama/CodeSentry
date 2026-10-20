import pytest

from app.services.file_scanner import RutaInexistenteError, escanear

LENGUAJES = ["js", "ts", "py"]


@pytest.fixture
def proyecto(tmp_path):
    (tmp_path / "a.js").write_text("let a = 1;")
    (tmp_path / "b.ts").write_text("const b = 2;")
    (tmp_path / "c.py").write_text("c = 3")
    (tmp_path / "main.go").write_text("package main")
    nm = tmp_path / "node_modules"
    nm.mkdir()
    (nm / "x.js").write_text("x")
    return tmp_path


def test_carpeta_devuelve_solo_soportados(proyecto):
    archivos, _ = escanear(str(proyecto), "carpeta", None, LENGUAJES)
    assert sorted(archivos) == ["a.js", "b.ts", "c.py"]


def test_go_va_a_omitidos(proyecto):
    _, omitidos = escanear(str(proyecto), "carpeta", None, LENGUAJES)
    assert [(o.ruta_relativa, o.motivo) for o in omitidos] == [("main.go", "lenguaje no soportado")]


def test_node_modules_se_ignora(proyecto):
    archivos, omitidos = escanear(str(proyecto), "carpeta", None, LENGUAJES)
    todo = archivos + [o.ruta_relativa for o in omitidos]
    assert not any("node_modules" in r for r in todo)


def test_objetivo_archivo_devuelve_solo_ese(proyecto):
    archivos, omitidos = escanear(str(proyecto), "archivo", "b.ts", LENGUAJES)
    assert archivos == ["b.ts"]
    assert omitidos == []


def test_ruta_base_inexistente(tmp_path):
    with pytest.raises(RutaInexistenteError) as e:
        escanear(str(tmp_path / "no_existe"), "carpeta", None, LENGUAJES)
    assert e.value.codigo == "RUTA_INEXISTENTE" and e.value.status == 400