from pathlib import Path

import pytest

from app.services.reglas import PATRONES, TABLA, analizar

RAIZ = Path(__file__).parent / "fixtures" / "vulnerable_codebase"


def _t(*lineas: str) -> str:
    return "\n".join(lineas)


def _hallazgos(codigo: str, lenguaje: str) -> set[tuple[str, int]]:
    return {(h.regla, h.linea_codigo) for h in analizar(codigo, lenguaje)}


def test_eval_ignora_comentarios_y_cadenas():
    c = _t("// uso eval(x) aquí", "/* eval(y) */", 'const msg = "no uses eval(z)";', "const r = eval(entrada);")
    assert _hallazgos(c, "js") == {("eval", 4)}


def test_sql_js_concatenado_si_parametrizado_no():
    c = _t(
        'const q = "SELECT * FROM users WHERE id = " + id;',
        'db.get("SELECT * FROM users WHERE id = ?", [id]);',
        "const t = `DELETE FROM logs WHERE user = ${u}`;",
    )
    assert _hallazgos(c, "js") == {("sql-inyeccion", 1), ("sql-inyeccion", 3)}


def test_sql_python():
    c = _t(
        'query = f"SELECT * FROM users WHERE email = \'{email}\'"',
        'cursor.execute("SELECT * FROM users WHERE id = %s", (uid,))',
        'q = "DELETE FROM t WHERE id = %d" % uid',
    )
    assert _hallazgos(c, "py") == {("sql-inyeccion", 1), ("sql-inyeccion", 3)}


def test_shell_python():
    c = _t("subprocess.check_output(cmd, shell=True)", "# shell=True en un comentario", "subprocess.run(a, shell=False)")
    assert _hallazgos(c, "py") == {("cmd-shell", 1)}


def test_secretos():
    c = _t(
        'const HardcodedSecret = "sk_live_9876543210_super_secret_key";',
        'const tokenUrl = "https://example.com/oauth/token";',
        'const password = "";',
        "const apiKey = process.env.API_KEY;",
        'const nota = "esto es una contraseña de ejemplo";',
    )
    assert _hallazgos(c, "ts") == {("secreto", 1)}


def test_ruta_concatenada():
    c = _t(
        'const fullPath = "/var/www/uploads/" + filePath;',
        'const fileName = "reporte-" + fecha;',
        'fs.readFileSync("/data/" + nombre);',
    )
    assert _hallazgos(c, "js") == {("ruta-concatenada", 1), ("ruta-concatenada", 3)}


def test_prototipos():
    inseguro = _t("for (const key in source) {", "    target[key] = source[key];", "}")
    seguro = _t("for (const key in source) {", '    if (key === "__proto__") continue;', "    target[key] = source[key];", "}")
    assert _hallazgos(inseguro, "ts") == {("prototipos", 2)}
    assert _hallazgos(seguro, "ts") == set()


def test_bucle_infinito_js():
    infinito = _t("while (i < items.length) {", '    console.log("x " + items[i]);', "}")
    con_incremento = _t("while (i < items.length) {", "    i++;", "}")
    con_salida = _t("while (i < items.length) {", "    if (listo) break;", "}")
    assert _hallazgos(infinito, "js") == {("bucle-infinito", 1)}
    assert _hallazgos(con_incremento, "js") == set()
    assert _hallazgos(con_salida, "js") == set()


def test_bucle_infinito_python():
    infinito = _t("while i < len(items):", "    print(items[i])", "", "x = 1")
    con_incremento = _t("while i < len(items):", "    print(items[i])", "    i += 1")
    assert _hallazgos(infinito, "py") == {("bucle-infinito", 1)}
    assert _hallazgos(con_incremento, "py") == set()


def test_igualdad_laxa():
    c = _t("if (a == b) {}", "if (a === b) {}", "if (x == null) {}", 'const s = "a == b";', "if (a != b) {}", "if (a !== b) {}")
    assert _hallazgos(c, "js") == {("igualdad-laxa", 1), ("igualdad-laxa", 5)}


def test_octal_off_by_one_y_division():
    c = _t(
        "const pin = 00123;",
        'const ok = "00123";',
        "const x = 0.5;",
        "for (let i = 0; i <= ratings.length; i++) {",
        "    total += ratings[i];",
        "}",
        "return total / ratings.length;",
        'const url = "http://a.com/" + n;',
    )
    assert _hallazgos(c, "js") == {("octal", 1), ("off-by-one", 4), ("division-longitud", 7)}


def test_null_find():
    sin_guarda = _t("const user = this.users.find(u => u.id === id);", "return user.email.length;")
    con_guarda = _t(
        "const user = this.users.find(u => u.id === id);",
        "if (!user) throw new Error('x');",
        "return user.email.length;",
    )
    opcional = _t("const user = this.users.find(u => u.id === id);", "return user?.email;")
    assert _hallazgos(sin_guarda, "ts") == {("null-find", 2)}
    assert _hallazgos(con_guarda, "ts") == set()
    assert _hallazgos(opcional, "ts") == set()


def test_any_solo_en_typescript():
    c = "function f(data: any): any { return data as any; }"
    assert _hallazgos(c, "ts") == {("any", 1)}
    assert _hallazgos(c, "js") == set()


def test_python_pickle_default_mutable_y_open():
    c = _t(
        "data = pickle.loads(blob)",
        "def log(evento, logs=[]):",
        "    pass",
        "f = open(nombre)",
        "with open(nombre) as g:",
        "    pass",
    )
    assert _hallazgos(c, "py") == {("deserializacion", 1), ("default-mutable", 2), ("open-sin-with", 4)}


def test_docstring_python_se_ignora():
    c = _t("def f():", '    """', "    Evita pickle.loads(x) y shell=True", '    """', "    return 1")
    assert _hallazgos(c, "py") == set()


def test_comentario_de_bloque_js():
    c = _t("/*", " * return eval(x);", " */", "const a = 1;")
    assert _hallazgos(c, "js") == set()


def test_lenguaje_desconocido():
    assert analizar("eval(x)", "go") == []


def test_resultado_ordenado_con_tipo_y_severidad():
    c = _t('const q = "SELECT * FROM t WHERE a = " + a;', "eval(b);")
    hs = analizar(c, "js")
    assert [(h.linea_codigo, h.regla) for h in hs] == [(1, "sql-inyeccion"), (2, "eval")]
    assert (hs[0].tipo, hs[0].severidad) == ("vulnerabilidad", "alta")
    assert (hs[1].tipo, hs[1].severidad) == ("vulnerabilidad", "critica")
    assert all(h.descripcion for h in hs)


def test_tabla_usa_solo_valores_del_contrato():
    for tipo, severidad, descripcion in TABLA.values():
        assert tipo in {"vulnerabilidad", "mala_practica", "refactorizacion"}
        assert severidad in {"baja", "media", "alta", "critica"}
        assert len(descripcion) > 20
    assert {p[0] for p in PATRONES} <= set(TABLA)
    assert {"bucle-infinito", "prototipos", "null-find"} <= set(TABLA)


def test_linea_larguisima_se_ignora():
    assert analizar("eval(x);" + "a" * 3000, "js") == []


# --- Con los archivos de prueba reales del proyecto (no son pruebas del código, son del analizador) ---

sin_fixtures = pytest.mark.skipif(not RAIZ.exists(), reason="faltan los fixtures en tests/fixtures")


def _leer(ruta: str) -> str:
    return (RAIZ / ruta).read_text(encoding="utf-8")


def _linea(codigo: str, fragmento: str) -> int:
    for i, linea in enumerate(codigo.splitlines(), start=1):
        if fragmento in linea and not linea.lstrip().startswith(("//", "#", "*")):
            return i
    raise AssertionError(f"no está en el fixture: {fragmento}")


@sin_fixtures
def test_fixture_app_js():
    c = _leer("javascript/app.js")
    esperado = {
        ("sql-inyeccion", _linea(c, "let query =")),
        ("eval", _linea(c, "return eval(userCode)")),
        ("off-by-one", _linea(c, "i <= ratings.length")),
        ("division-longitud", _linea(c, "return total / ratings.length")),
        ("igualdad-laxa", _linea(c, 'inputPin == "00123"')),
        ("octal", _linea(c, "const storedPin = 00123")),
        ("ruta-concatenada", _linea(c, "const fullPath")),
    }
    assert _hallazgos(c, "js") == esperado


@sin_fixtures
def test_fixture_vulnerable_service_py():
    c = _leer("python/vulnerable_service.py")
    esperado = {
        ("cmd-shell", _linea(c, "check_output(command, shell=True)")),
        ("deserializacion", _linea(c, "return pickle.loads")),
        ("sql-inyeccion", _linea(c, 'query = f"SELECT')),
        ("default-mutable", _linea(c, "def add_event_log")),
        ("open-sin-with", _linea(c, "f = open(filename")),
    }
    assert _hallazgos(c, "py") == esperado


@sin_fixtures
def test_fixture_user_manager_ts():
    c = _leer("typescript/userManager.ts")
    esperado = {
        ("any", _linea(c, "processRawData(data: any)")),
        ("any", _linea(c, "mergeUserSettings(target: any")),
        ("null-find", _linea(c, "return user.email.length")),
        ("secreto", _linea(c, "const HardcodedSecret")),
        ("bucle-infinito", _linea(c, "while (i < items.length)")),
        ("prototipos", _linea(c, "target[key] = source[key]")),
    }
    assert _hallazgos(c, "ts") == esperado