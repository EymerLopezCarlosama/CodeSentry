import pytest

from app.services import ollama_client
from app.services.explicacion import MAX_CARACTERES, construir_prompt, explicar, fragmento, limpiar
from app.services.reglas import HallazgoRegla

LINEAS = [f"linea {i}" for i in range(1, 21)]
HALLAZGO = HallazgoRegla("eval", "vulnerabilidad", "critica", 10, "Descripción fija de la tabla para eval.")


def test_fragmento_marca_la_linea_y_acota_el_rango():
    f = fragmento(LINEAS, 10).splitlines()
    assert f[0] == "   7 | linea 7" and f[-1] == "   13 | linea 13"
    assert [fila for fila in f if fila.startswith(">>")] == [">> 10 | linea 10"]
    assert fragmento(LINEAS, 1).splitlines()[0] == ">> 1 | linea 1"
    assert fragmento(LINEAS, 20).splitlines()[-1] == ">> 20 | linea 20"


def test_el_prompt_incluye_el_problema_y_el_codigo():
    p = construir_prompt("Texto del problema", ">> 10 | eval(x)", "js")
    assert "Texto del problema" in p and ">> 10 | eval(x)" in p and "JavaScript" in p
    assert "dos frases" in p


@pytest.mark.parametrize(
    "crudo,esperado",
    [
        (
            "La función usa eval con datos externos; reemplácelo por JSON.parse.",
            "La función usa eval con datos externos; reemplácelo por JSON.parse.",
        ),
        (
            "Explicación: **El bucle** no actualiza `i` y nunca termina.",
            "El bucle no actualiza i y nunca termina.",
        ),
        (
            "- Primera frase de la explicación del error.\nSegunda frase.",
            "Primera frase de la explicación del error. Segunda frase.",
        ),
        (
            '"Se concatena la entrada del usuario en la consulta SQL."',
            "Se concatena la entrada del usuario en la consulta SQL.",
        ),
        (
            "Texto antes\n```js\neval(x)\n```\nAhora la explicación completa del problema aquí.",
            "Texto antes Ahora la explicación completa del problema aquí.",
        ),
    ],
)
def test_limpiar_deja_texto_plano(crudo, esperado):
    assert limpiar(crudo) == esperado


@pytest.mark.parametrize("crudo", ["", "   ", "Sí.", "```js\neval(x)\n```"])
def test_limpiar_rechaza_lo_inutil(crudo):
    assert limpiar(crudo) is None


def test_limpiar_recorta_en_el_limite_de_una_frase():
    largo = "Primera frase completa y correcta. " + "palabra " * 80
    r = limpiar(largo)
    assert r == "Primera frase completa y correcta."
    sin_puntos = limpiar("palabra " * 80)
    assert sin_puntos is not None and len(sin_puntos) <= MAX_CARACTERES + 1 and sin_puntos.endswith("…")


def test_explicar_usa_la_respuesta_y_pide_texto_libre_con_tope():
    visto = {}

    def falso(modelo, prompt, **opciones):
        visto.update(modelo=modelo, prompt=prompt, **opciones)
        return "La línea 10 evalúa texto recibido: sustitúyalo por JSON.parse."

    r = explicar(HALLAZGO, LINEAS, "js", "m", generar=falso)
    assert r == "La línea 10 evalúa texto recibido: sustitúyalo por JSON.parse."
    assert visto["formato"] is None and visto["max_tokens"] == 110 and visto["modelo"] == "m"
    assert ">> 10 | linea 10" in visto["prompt"] and HALLAZGO.descripcion in visto["prompt"]


def test_explicar_cae_a_la_descripcion_fija_si_la_respuesta_no_sirve():
    assert explicar(HALLAZGO, LINEAS, "js", "m", generar=lambda *a, **k: "ok") == HALLAZGO.descripcion


def test_explicar_cae_a_la_descripcion_fija_ante_errores_de_ollama():
    def falla(*a, **k):
        raise ollama_client.OllamaTiempoExcedidoError("tarda")

    assert explicar(HALLAZGO, LINEAS, "js", "m", generar=falla) == HALLAZGO.descripcion


def test_explicar_propaga_ollama_apagado():
    def apagado(*a, **k):
        raise ollama_client.OllamaNoDisponibleError("sin conexión")

    with pytest.raises(ollama_client.OllamaNoDisponibleError):
        explicar(HALLAZGO, LINEAS, "js", "m", generar=apagado)


def test_explicar_con_linea_fuera_del_archivo_no_llama_al_modelo():
    fuera = HallazgoRegla("eval", "vulnerabilidad", "critica", 99, "Fija.")

    def no_debe_llamarse(*a, **k):
        raise AssertionError("no debería llamar al modelo")

    assert explicar(fuera, LINEAS, "js", "m", generar=no_debe_llamarse) == "Fija."


# --- Pruebas de pocos disparos (Few-shot prompting / Ejemplos aceptados) ---


def test_el_prompt_incluye_los_ejemplos_aceptados():
    p = construir_prompt("Problema", ">> 1 | eval(x)", "js", ["Ejemplo aceptado uno.", "Otro ejemplo aceptado."])
    assert "Ejemplo 1: Ejemplo aceptado uno." in p and "Ejemplo 2: Otro ejemplo aceptado." in p
    sin = construir_prompt("Problema", ">> 1 | eval(x)", "js")
    assert "Ejemplo" not in sin and "dos frases" in sin


def test_explicar_pasa_al_prompt_solo_ejemplos_utiles():
    visto = {}

    def falso(modelo, prompt, **opciones):
        visto["prompt"] = prompt
        return "La línea 10 evalúa texto recibido: sustitúyalo por JSON.parse."

    ejemplos = [
        HALLAZGO.descripcion,
        "  ",
        "Explicación aceptada A.",
        "Explicación aceptada A.",
        "Explicación aceptada B.",
        "Explicación aceptada C.",
    ]
    explicar(HALLAZGO, LINEAS, "js", "m", generar=falso, ejemplos=ejemplos)
    p = visto["prompt"]
    assert "Ejemplo 1: Explicación aceptada A." in p and "Ejemplo 2: Explicación aceptada B." in p
    assert "Explicación aceptada C." not in p  # tope de 2
    assert p.count(HALLAZGO.descripcion) == 1  # la fija solo aparece como "Problema", no como ejemplo


def test_sin_ejemplos_el_prompt_no_cambia():
    visto = {}

    def falso(modelo, prompt, **opciones):
        visto["prompt"] = prompt
        return "ok"

    explicar(HALLAZGO, LINEAS, "js", "m", generar=falso)
    assert "Ejemplo 1" not in visto["prompt"]