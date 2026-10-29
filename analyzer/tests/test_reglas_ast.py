import textwrap

from app.services.reglas_ast import variables_sin_definir


def _v(codigo: str) -> list[tuple[int, str]]:
    return variables_sin_definir(textwrap.dedent(codigo).lstrip("\n"))


def test_asignada_solo_en_un_if():
    assert _v("""
        def f(contenido):
            if "ERROR" in contenido:
                estado = "malo"
            print(estado)
    """) == [(4, "estado")]


def test_if_else_define_en_ambas_ramas():
    assert _v("""
        def f(c):
            if c:
                x = 1
            else:
                x = 2
            return x
    """) == []


def test_rama_que_termina_no_cuenta():
    assert _v("""
        def f(c):
            if c:
                x = 1
            else:
                return None
            return x
    """) == []


def test_guarda_con_raise():
    assert _v("""
        def f(c):
            if not c:
                msg = "falta"
                raise ValueError(msg)
            return 1
    """) == []


def test_inicializada_antes():
    assert _v("""
        def f(c):
            x = None
            if c:
                x = 1
            return x
    """) == []


def test_parametros_no_cuentan():
    assert _v("""
        def f(a, b=1, *args, **kw):
            if a:
                pass
            return a, b, args, kw
    """) == []


def test_elif_sin_else_si_con_else_no():
    assert _v("""
        def f(a):
            if a == 1:
                r = "uno"
            elif a == 2:
                r = "dos"
            return r
    """) == [(6, "r")]
    assert _v("""
        def f(a):
            if a == 1:
                r = "uno"
            elif a == 2:
                r = "dos"
            else:
                r = "otro"
            return r
    """) == []


def test_try_except_se_ignora_por_prudencia():
    assert _v("""
        def f(p):
            try:
                v = int(p)
            except ValueError:
                v = 0
            return v
    """) == []
    assert _v("""
        def f(p):
            try:
                v = int(p)
            except ValueError:
                pass
            return v
    """) == []


def test_bucles_no_se_marcan():
    assert _v("""
        def f(items):
            for i in items:
                ultimo = i
            return ultimo
    """) == []
    assert _v("""
        def f(c):
            while c:
                x = 1
                c = False
            return x
    """) == []


def test_funcion_anidada_no_cuenta_como_uso():
    assert _v("""
        def f(c):
            if c:
                x = 1
            def g():
                return x
            return g
    """) == []


def test_una_sola_vez_por_nombre():
    assert _v("""
        def f(c):
            if c:
                x = 1
            print(x)
            print(x)
    """) == [(4, "x")]


def test_codigo_con_errores_de_sintaxis():
    assert variables_sin_definir("def f(:\n    pass") == []
    assert variables_sin_definir("") == []


def test_global_se_ignora():
    assert _v("""
        def f(c):
            global x
            if c:
                x = 1
            return x
    """) == []


def test_metodo_de_clase():
    assert _v("""
        class A:
            def m(self, c):
                if c:
                    v = 1
                return v
    """) == [(5, "v")]


def test_asignacion_aumentada():
    assert _v("""
        def f(c):
            if c:
                t = 0
            t += 1
    """) == [(4, "t")]


def test_codigo_de_modulo_no_se_analiza():
    assert _v("""
        if c:
            x = 1
        print(x)
    """) == []


def test_with_asigna_en_secuencia():
    assert _v("""
        def f(p):
            with open(p) as fh:
                datos = fh.read()
            return datos
    """) == []


def test_async():
    assert _v("""
        async def f(c):
            if c:
                x = 1
            return x
    """) == [(4, "x")]


def test_varias_funciones_en_orden():
    assert _v("""
        def a(c):
            if c:
                x = 1
            return x

        def b(c):
            if c:
                y = 1
            return y
    """) == [(4, "x"), (9, "y")]