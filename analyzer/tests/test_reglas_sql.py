from textwrap import dedent

from app.services.reglas import analizar


def cod(texto: str) -> str:
    return dedent(texto).lstrip("\n")


def hallados(codigo: str, lenguaje: str) -> set[tuple[str, int]]:
    return {(h.regla, h.linea_codigo) for h in analizar(codigo, lenguaje)}


# ---------- inyección SQL ----------

def test_js_query_con_concatenacion_sin_sql_en_la_linea():
    assert ("sql-inyeccion", 1) in hallados('db.query(base + " AND id = " + id);\n', "js")


def test_js_query_parametrizada_no_se_marca():
    assert ("sql-inyeccion", 1) not in hallados('db.query("SELECT * FROM users WHERE id = ?", [id]);\n', "js")


def test_js_template_con_interpolacion():
    assert ("sql-inyeccion", 1) in hallados("db.query(`DELETE FROM t WHERE id = ${id}`);\n", "js")


def test_py_execute_con_concatenacion():
    assert ("sql-inyeccion", 1) in hallados('cursor.execute(sql + " WHERE id = " + str(id))\n', "py")


def test_py_execute_parametrizado_no_se_marca():
    assert ("sql-inyeccion", 1) not in hallados(
        'cursor.execute("SELECT * FROM t WHERE id = %s", (id,))\n', "py"
    )


def test_py_consulta_armada_por_partes():
    codigo = cod(
        '''
        sql = "SELECT * FROM users WHERE 1=1"
        if nombre:
            sql += " AND nombre = '" + nombre + "'"
        '''
    )
    assert ("sql-inyeccion", 3) in hallados(codigo, "py")


def test_py_acumulado_sin_variables_no_se_marca():
    codigo = cod(
        '''
        sql = "SELECT * FROM users WHERE 1=1"
        sql += " AND activo = 1"
        '''
    )
    assert ("sql-inyeccion", 2) not in hallados(codigo, "py")


def test_js_acumulado_que_no_es_sql_no_se_marca():
    assert ("sql-inyeccion", 1) not in hallados('queryString += "&a=" + a;\n', "js")


# ---------- credenciales en conexiones ----------

def test_uri_con_usuario_y_clave():
    assert ("conexion-credenciales", 1) in hallados('const url = "mysql://root:root@localhost:3306/app";\n', "js")


def test_uri_con_marcadores_no_se_marca():
    assert "conexion-credenciales" not in {
        r for r, _ in hallados('engine = create_engine(f"postgresql://{user}:{clave}@localhost/db")\n', "py")
    }


def test_cadena_odbc_con_pwd():
    assert ("conexion-credenciales", 1) in hallados('conn = "Server=db;Database=app;Uid=sa;Pwd=Abc12345;"\n', "py")


def test_cadena_odbc_armada_con_variables_no_se_marca():
    codigo = 'conn = "Server=" + host + ";Password=" + pwd + ";"\n'
    assert "conexion-credenciales" not in {r for r, _ in hallados(codigo, "js")}


def test_js_password_corto_dentro_de_createconnection():
    codigo = cod(
        """
        const conexion = mysql.createConnection({
          host: "localhost",
          user: "root",
          password: "root",
        });
        """
    )
    assert ("conexion-credenciales", 4) in hallados(codigo, "js")


def test_py_password_literal_en_connect():
    codigo = 'conn = pymysql.connect(host="localhost", user="root", password="1234", db="app")\n'
    assert ("conexion-credenciales", 1) in hallados(codigo, "py")


def test_py_password_desde_entorno_no_se_marca():
    codigo = 'conn = pymysql.connect(host="localhost", user="root", password=os.getenv("DB_PASS"))\n'
    assert not {r for r, _ in hallados(codigo, "py")} & {"conexion-credenciales", "conexion-sin-password"}


def test_password_literal_fuera_de_una_conexion_no_se_marca():
    assert "conexion-credenciales" not in {r for r, _ in hallados('password = "abc"\n', "py")}


def test_password_vacio_en_connect():
    r = hallados('conn = pymysql.connect(host="localhost", user="root", password="")\n', "py")
    assert ("conexion-sin-password", 1) in r
    assert ("conexion-credenciales", 1) not in r


def test_sequelize_con_clave_posicional():
    assert ("conexion-credenciales", 1) in hallados('const s = new Sequelize("app", "root", "secreto1");\n', "js")


def test_credencial_larga_no_se_duplica_con_secreto():
    codigo = cod(
        """
        const db = mysql.createConnection({
          password: "SuperClave123",
        });
        """
    )
    r = hallados(codigo, "js")
    assert ("conexion-credenciales", 2) in r
    assert ("secreto", 2) not in r


# ---------- cifrado y sentencias múltiples ----------

def test_ssl_desactivado_js():
    assert ("conexion-sin-cifrar", 1) in hallados('const pool = new Pool({ host: "db", ssl: false });\n', "js")


def test_sslmode_disable_py():
    assert ("conexion-sin-cifrar", 1) in hallados('conn = psycopg2.connect(dsn, sslmode="disable")\n', "py")


def test_ssl_activado_no_se_marca():
    assert "conexion-sin-cifrar" not in {r for r, _ in hallados('conn = psycopg2.connect(dsn, sslmode="require")\n', "py")}


def test_multiple_statements():
    assert ("multiples-sentencias", 1) in hallados("createConnection({ multipleStatements: true });\n", "js")


def test_multiple_statements_desactivado_no_se_marca():
    assert "multiples-sentencias" not in {r for r, _ in hallados("createConnection({ multipleStatements: false });\n", "js")}