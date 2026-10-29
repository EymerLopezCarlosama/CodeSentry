from app.services.deteccion_ia import CATEGORIAS, construir_prompt, interpretar

LINEAS = ["a = 1", "", "print(b)", "x = 2"]  # con offset 10 son las líneas 11 a 14


def _pares(texto: str, offset: int = 10):
    return {(h.linea_codigo, h.regla) for h in interpretar(texto, LINEAS, offset)}


def test_acepta_formatos_y_valida_lineas():
    texto = "11: variable-no-definida\n- 13 | xss\n14,logica-erronea\n12: xss\n999: xss\n13: inventada\nNINGUNO"
    # la 12 está vacía, la 999 no existe en el fragmento y "inventada" no es una categoría
    assert _pares(texto) == {(11, "variable-no-definida"), (13, "xss"), (14, "logica-erronea")}


def test_tipo_y_severidad_salen_de_la_tabla():
    h = interpretar("13: xss", LINEAS, 10)[0]
    assert (h.tipo, h.severidad) == ("vulnerabilidad", "alta")
    assert h.descripcion == CATEGORIAS["xss"][3]


def test_sin_problemas_o_basura_no_da_hallazgos():
    assert _pares("NINGUNO") == set()
    assert _pares("No encontré nada.") == set()
    assert _pares("") == set()


def test_quita_duplicados():
    assert _pares("13: xss\n13: xss\n13: XSS") == {(13, "xss")}


def test_prompt_numera_con_offset_y_lista_categorias():
    p = construir_prompt("a = 1\nb = 2", "py", offset=10)
    assert "11 | a = 1" in p and "12 | b = 2" in p
    assert all(id_ in p for id_ in CATEGORIAS)
    assert "NINGUNO" in p


def test_el_modelo_no_clasifica_tipo_ni_severidad():
    p = construir_prompt("x = 1", "py").lower()
    assert "severidad" not in p and "vulnerabilidad\"" not in p


def test_la_tabla_usa_solo_valores_del_contrato():
    for tipo, severidad, pregunta, descripcion in CATEGORIAS.values():
        assert tipo in {"vulnerabilidad", "mala_practica", "refactorizacion"}
        assert severidad in {"baja", "media", "alta", "critica"}
        assert pregunta and len(descripcion) > 20