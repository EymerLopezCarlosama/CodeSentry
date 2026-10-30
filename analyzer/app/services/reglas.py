"""Motor de reglas estáticas: detecta patrones conocidos sin IA.

Da la línea exacta y clasifica tipo y severidad desde una tabla, siempre igual.
Solo lectura: nunca ejecuta ni modifica el código analizado.
"""

import re
from dataclasses import dataclass
from app.services.reglas_ast import variables_sin_definir

JS = ("js", "ts")
TODOS = ("js", "ts", "py")
MAX_LINEA = 2000  # las líneas más largas (JS minificado) se ignoran: son lentas y no son código escrito a mano

# id -> (tipo, severidad, descripción). Es la ÚNICA fuente de la clasificación.
TABLA: dict[str, tuple[str, str, str]] = {
    "eval": (
        "vulnerabilidad",
        "critica",
        "Ejecución dinámica de código (eval/exec/Function): permite ejecutar código arbitrario si recibe datos "
        "externos. Evítela; use JSON.parse, ast.literal_eval o una lista de operaciones permitidas.",
    ),
    "cmd-shell": (
        "vulnerabilidad",
        "critica",
        "Se ejecuta un comando con shell=True: una entrada externa puede inyectar comandos. Pase los "
        "argumentos como lista y use shell=False.",
    ),
    "secreto": (
        "vulnerabilidad",
        "critica",
        "Credencial o clave escrita directamente en el código. Muévala a una variable de entorno o a un "
        "gestor de secretos y rótela.",
    ),
        "conexion-credenciales": (
        "vulnerabilidad",
        "critica",
        "Usuario y contraseña de una base de datos escritos en el código (cadena o parámetros de conexión). "
        "Cualquiera con acceso al repositorio puede usarlos. Léalos de variables de entorno, no los suba a "
        "git y rote la contraseña.",
    ),
    "conexion-sin-password": (
        "vulnerabilidad",
        "alta",
        "La conexión a la base de datos usa una contraseña vacía: cualquiera que alcance el servidor puede "
        "entrar. Asigne una contraseña y léala de una variable de entorno.",
    ),
    "multiples-sentencias": (
        "vulnerabilidad",
        "media",
        "multipleStatements permite ejecutar varias sentencias SQL en una sola consulta: si existe una "
        "inyección, el atacante puede encadenar DROP o UPDATE. Desactívelo y use consultas parametrizadas.",
    ),
    "conexion-sin-cifrar": (
        "vulnerabilidad",
        "media",
        "La conexión a la base de datos se configura sin cifrado TLS (ssl desactivado): credenciales y datos "
        "viajan en texto plano. Actívelo, sobre todo si la base no está en este mismo equipo.",
    ),
    "sql-inyeccion": (
        "vulnerabilidad",
        "alta",
        "Consulta SQL armada concatenando o interpolando valores: permite inyección SQL. Use consultas "
        "parametrizadas.",
    ),
    "ruta-concatenada": (
        "vulnerabilidad",
        "alta",
        "La ruta de un archivo se arma concatenando un valor externo: riesgo de path traversal. Valide la "
        "entrada y resuelva la ruta dentro de una carpeta permitida.",
    ),
    "prototipos": (
        "vulnerabilidad",
        "alta",
        "Se copian propiedades con for...in sin filtrar __proto__ ni constructor: riesgo de contaminación de "
        "prototipos. Ignore esas claves o use Object.hasOwn.",
    ),
    "deserializacion": (
        "vulnerabilidad",
        "alta",
        "Deserialización insegura (pickle/marshal/yaml.load): ejecuta código si el dato viene de fuera. "
        "Use JSON o yaml.safe_load.",
    ),
    "bucle-infinito": (
        "mala_practica",
        "alta",
        "El bucle no modifica la variable de su condición ni tiene salida: no termina y bloquea el proceso. "
        "Actualice la variable dentro del bucle.",
    ),
    "tls-desactivado": (
        "vulnerabilidad",
        "media",
        "Se desactiva la verificación del certificado TLS: expone a ataques de intermediario. Déjela activa.",
    ),
    "hash-debil": (
        "vulnerabilidad",
        "media",
        "Algoritmo de hash débil (MD5/SHA-1). Use SHA-256 o superior; para contraseñas, bcrypt o argon2.",
    ),
    "off-by-one": (
        "mala_practica",
        "media",
        "El bucle usa <= contra .length: la última iteración accede fuera del arreglo. Use <.",
    ),
    "null-find": (
        "mala_practica",
        "media",
        "El resultado de .find() puede ser undefined y se usa sin comprobarlo: fallará en ejecución. "
        "Compruebe el valor o use ?.",
    ),
    "default-mutable": (
        "mala_practica",
        "media",
        "Argumento por defecto mutable: se comparte entre llamadas. Use None y cree la lista dentro de la "
        "función.",
    ),
    "open-sin-with": (
        "mala_practica",
        "media",
        "El archivo se abre sin with: puede quedar abierto si ocurre un error. Use with open(...) as f.",
    ),
    "variable-no-definida": (
        "mala_practica",
        "media",
        "La variable `{nombre}` solo se asigna en algunas ramas y se usa después: si no se cumple esa "
        "condición, falla por variable sin definir. Inicialícela antes de la condición.",
    ),
    "igualdad-laxa": (
        "mala_practica",
        "baja",
        "Comparación con == / != aplica coerción de tipos. Use === / !==.",
    ),
    "octal": (
        "mala_practica",
        "baja",
        "Número con cero a la izquierda: JavaScript lo interpreta como octal. Quite el cero (o use 0o).",
    ),
    "division-longitud": (
        "mala_practica",
        "baja",
        "Se divide entre .length sin comprobar que no sea 0 (da NaN o Infinity). Compruebe que el arreglo "
        "no esté vacío.",
    ),
    "any": (
        "refactorizacion",
        "baja",
        "El tipo any desactiva la comprobación de tipos. Defina una interfaz o use unknown con validación.",
    ),
}


@dataclass(frozen=True)
class HallazgoRegla:
    regla: str
    tipo: str
    severidad: str
    linea_codigo: int
    descripcion: str


# ---------------------------------------------------------------------------
# Limpieza: se blanquean los comentarios (sin mover ninguna línea) para no detectar texto que no es código
# ---------------------------------------------------------------------------


def _quitar_comentarios_js(codigo: str) -> str:
    salida: list[str] = []
    i, n = 0, len(codigo)
    cadena = ""
    while i < n:
        c = codigo[i]
        sig = codigo[i + 1] if i + 1 < n else ""
        if cadena:
            salida.append(c)
            if c == "\\" and sig:
                salida.append(sig)
                i += 2
                continue
            if c == cadena or (c == "\n" and cadena != "`"):
                cadena = ""
            i += 1
            continue
        if c in "\"'`":
            cadena = c
            salida.append(c)
        elif c == "/" and sig == "/":
            while i < n and codigo[i] != "\n":
                salida.append(" ")
                i += 1
            continue
        elif c == "/" and sig == "*":
            fin = codigo.find("*/", i + 2)
            fin = n if fin == -1 else fin + 2
            salida.extend("\n" if ch == "\n" else " " for ch in codigo[i:fin])
            i = fin
            continue
        else:
            salida.append(c)
        i += 1
    return "".join(salida)


def _quitar_comentarios_py(codigo: str) -> str:
    salida: list[str] = []
    i, n = 0, len(codigo)
    while i < n:
        c = codigo[i]
        triple = codigo[i : i + 3]
        if triple in ('"""', "'''"):
            fin = codigo.find(triple, i + 3)
            fin = n if fin == -1 else fin + 3
            previo = codigo.rfind("\n", 0, i)
            if codigo[previo + 1 : i].strip() == "":  # docstring: se ignora entero
                salida.extend("\n" if ch == "\n" else " " for ch in codigo[i:fin])
            else:  # cadena de varias líneas usada como dato (por ejemplo un SQL): se conserva
                salida.append(codigo[i:fin])
            i = fin
        elif c in "\"'":
            j = i + 1
            while j < n and codigo[j] != c and codigo[j] != "\n":
                j += 2 if codigo[j] == "\\" else 1
            fin = min(j + 1, n)
            salida.append(codigo[i:fin])
            i = fin
        elif c == "#":
            while i < n and codigo[i] != "\n":
                salida.append(" ")
                i += 1
        else:
            salida.append(c)
            i += 1
    return "".join(salida)


_CADENA = re.compile(r"\"(?:\\.|[^\"\\])*\"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`")


def _sin_cadenas(linea: str) -> str:
    return _CADENA.sub('""', linea)


# ---------------------------------------------------------------------------
# Reglas de una sola línea
# ---------------------------------------------------------------------------

_EVAL_JS = re.compile(r"\beval\s*\(|\bnew\s+Function\s*\(")
_EVAL_PY = re.compile(r"(?<![\w.])(?:eval|exec)\s*\(")
_SHELL = re.compile(r"\bshell\s*=\s*True\b")
_DESERIALIZACION = re.compile(
    r"\b(?:pickle|cPickle|marshal)\.loads?\s*\(|\byaml\.load\s*\((?![^)]*SafeLoader)"
)

_SQL = r"(?:\bSELECT\b.+\bFROM\b|\bINSERT\s+INTO\b|\bUPDATE\b.+\bSET\b|\bDELETE\s+FROM\b)"
_SQL_JS = re.compile(rf"""^(?=.*{_SQL})(?=.*(?:["'`]\s*\+|\+\s*["'`]|\$\{{))""")
_SQL_PY = re.compile(
    rf"""^(?=.*{_SQL})(?=.*(?:\bf["']|\.format\s*\(|["']\s*%\s*[\(\w]|["']\s*\+|\+\s*["']))"""
)

_SECRETO = re.compile(
    r"""(?i)\b\w*(?:secret|passw(?:or)?d|api[_-]?key|private[_-]?key|token)\w*["']?\s*[:=]\s*"""
    r"""["'](?!https?:|/|\./|\.\./)[^"'\s]{8,}["']"""
)
_CLAVE_PEM = re.compile(r"-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----")

_RUTA = re.compile(
    r"""(?i)\b\w*(?:path|dir|folder|ruta|file)\w*\s*=\s*[`"'][^`"']*[/\\][^`"']*[`"']\s*\+\s*\w"""
    r"""|\bfs\.\w+\(\s*[^)]*[`"']\s*\+\s*\w"""
)

_TLS_PY = re.compile(r"\bverify\s*=\s*False\b")
_TLS_JS = re.compile(r"\brejectUnauthorized\s*:\s*false\b")
_HASH_PY = re.compile(r"\bhashlib\.(?:md5|sha1)\s*\(")
_HASH_JS = re.compile(r"""\bcreateHash\s*\(\s*["'](?:md5|sha1)["']\s*\)""")

_OFF = re.compile(r"\bfor\s*\([^;)]*;\s*\w+\s*<=\s*[\w.]+\.length\s*;")
_DIV = re.compile(r"(?<![/*])/(?![/*=])\s*[\w.]+\.length\b")
_IGUALDAD = re.compile(r"(?<![=!<>])(?:==|!=)(?!=)(?!\s*(?:null|undefined)\b)")
_OCTAL = re.compile(r"(?<![\w.$])0\d+(?![\w.])")
_ANY = re.compile(r"(?::\s*any\b|\bas\s+any\b|<any>)")

_MUTABLE = re.compile(r"\bdef\s+\w+\s*\([^)]*=\s*(?:\[\s*\]|\{\s*\}|set\(\s*\))")
_OPEN = re.compile(r"^\s*\w+\s*=\s*open\s*\(")

# --- SQL y conexiones a bases de datos ---
# Llamadas que reciben una consulta armada por concatenación o interpolación (aunque el SQL no esté en la línea)
_SQL_LLAMADA_JS = re.compile(
    r"""(?:\b(?:query|execute|raw)|\$(?:query|execute)RawUnsafe)\s*\(\s*(?:"""
    r"""`[^`]*\$\{|[^()]*["'`]\s*\+\s*[\w(]|[^()]*[\w)\]]\s*\+\s*["'`])"""
)
_SQL_LLAMADA_PY = re.compile(
    r"""\b(?:execute|executemany|executescript|raw|read_sql|read_sql_query)\s*\(\s*(?:"""
    r"""f["']|[^()]*\.format\s*\(|[^()]*["']\s*\+\s*[\w(]|[^()]*[\w)\]]\s*\+\s*["'])"""
)

# Credenciales dentro de una URI: mysql://usuario:clave@host (se ignoran los marcadores ${x}, {x}, %s, <x>)
_URI_CREDENCIALES = re.compile(
    r"""(?i)\b(?:mysql2?|mariadb|postgres(?:ql)?|mongodb(?:\+srv)?|rediss?|amqps?|mssql|sqlserver|oracle)"""
    r"""://[^\s:/@"'`]+:(?![${%<\[])[^\s/@"'`]+@"""
)
# Cadenas estilo ODBC/JDBC: Server=x;Uid=sa;Pwd=clave;  o  jdbc:...?user=a&password=clave
_CADENA_CONEXION = re.compile(
    r"(?i)^(?=.*(?:\bjdbc:|\bserver\s*=|\bhost\s*=|\bdata\s+source\s*=|\bdatabase\s*=|\bdriver\s*=|\buid\s*=|\buser(?:\s+id)?\s*=))"
    r""".*[;?&]\s*(?:password|pwd)\s*=\s*(?![${%<\[])[^&;\s"'`{]+"""
)
_SEQUELIZE = re.compile(
    r"""\bnew\s+Sequelize\s*\(\s*["'][^"']+["']\s*,\s*["'][^"']+["']\s*,\s*["'][^"']+["']"""
)
_SSL_OFF = re.compile(
    r"""\bssl\s*:\s*false\b|\bssl\s*=\s*False\b|\bssl_disabled\s*=\s*True\b|\buseSSL\s*[:=]\s*false\b"""
    r"""|\bsslmode\s*=\s*["']?(?:disable|allow)\b"""
)
_MULTI = re.compile(r"\bmultipleStatements\s*:\s*true\b|\bMULTI_STATEMENTS\b")

# Para las reglas de bloque
_LLAMADA_CONEXION = re.compile(
    r"\b(?:createConnection|createPool|createClient|MongoClient|create_engine|knex|"
    r"(?:pymysql|MySQLdb|psycopg2?|asyncpg|aiomysql|pyodbc|pymssql|oracledb)\.(?:connect|create_pool)|"
    r"connector\.connect|redis\.(?:Redis|StrictRedis)|new\s+(?:Pool|Client|Sequelize|Knex))\s*\("
)
_PASSWORD_LIT = re.compile(r"""(?i)\b(?:password|passwd|pwd|pass)\b["']?\s*[:=]\s*(["'])(.*?)\1""")
_ACUM_RHS = "|".join(
    [
        r'''f"[^"]*\{''',
        r"""f'[^']*\{""",
        r"""`[^`]*\$\{""",
        r'''"[^"]*"\s*\+\s*[A-Za-z_]''',
        r"""'[^']*'\s*\+\s*[A-Za-z_]""",
        r"""[A-Za-z_][\w.\[\]()]*\s*\+\s*["'`]""",
    ]
)
_SQL_ACUM = re.compile(
    rf"\b\w*(?:sql|query|consulta|stmt|statement)\w*\s*\+=\s*(?:{_ACUM_RHS})", re.IGNORECASE
)
_SQL_PISTA = re.compile(r"\b(?:SELECT\b|INSERT\s+INTO\b|UPDATE\s+\w+\s+SET\b|DELETE\s+FROM\b|WHERE\b)")

# (id de la tabla, lenguajes, patrón, ignorar el contenido de las cadenas)
PATRONES: list[tuple[str, tuple[str, ...], re.Pattern[str], bool]] = [
    ("eval", JS, _EVAL_JS, True),
    ("eval", ("py",), _EVAL_PY, True),
    ("cmd-shell", ("py",), _SHELL, False),
    ("sql-inyeccion", JS, _SQL_JS, False),
    ("sql-inyeccion", ("py",), _SQL_PY, False),
    ("secreto", TODOS, _SECRETO, False),
    ("secreto", TODOS, _CLAVE_PEM, False),
    ("ruta-concatenada", JS, _RUTA, False),
    ("deserializacion", ("py",), _DESERIALIZACION, False),
    ("tls-desactivado", ("py",), _TLS_PY, False),
    ("tls-desactivado", JS, _TLS_JS, False),
    ("hash-debil", ("py",), _HASH_PY, False),
    ("hash-debil", JS, _HASH_JS, False),
    ("off-by-one", JS, _OFF, True),
    ("division-longitud", JS, _DIV, True),
    ("igualdad-laxa", JS, _IGUALDAD, True),
    ("octal", JS, _OCTAL, True),
    ("any", ("ts",), _ANY, True),
    ("default-mutable", ("py",), _MUTABLE, False),
    ("open-sin-with", ("py",), _OPEN, False),
    ("sql-inyeccion", JS, _SQL_LLAMADA_JS, False),
    ("sql-inyeccion", ("py",), _SQL_LLAMADA_PY, False),
    ("conexion-credenciales", TODOS, _URI_CREDENCIALES, False),
    ("conexion-credenciales", TODOS, _CADENA_CONEXION, False),
    ("conexion-credenciales", JS, _SEQUELIZE, False),
    ("conexion-sin-cifrar", TODOS, _SSL_OFF, False),
    ("multiples-sentencias", TODOS, _MULTI, False),
]

# ---------------------------------------------------------------------------
# Reglas de bloque (miran varias líneas)
# ---------------------------------------------------------------------------

_PROTO_FOR = re.compile(r"\bfor\s*\(\s*(?:const|let|var)\s+(\w+)\s+in\s+\w+\s*\)")
_BUCLE_JS = re.compile(r"\bwhile\s*\(\s*(\w+)\s*(?:<=|>=|<|>|!==|!=)")
_BUCLE_PY = re.compile(r"^\s*while\s+(\w+)\s*(?:<=|>=|<|>|!=)")
_FIND = re.compile(r"\b(?:const|let|var)\s+(\w+)\s*(?::[^=]+)?=\s*[^;]*\.find\s*\(")


def _fin_bloque_js(lineas: list[str], idx: int) -> int | None:
    """Índice de la línea donde se cierra el bloque { } que abre la línea idx (None si no hay llaves)."""
    profundidad = 0
    abierto = False
    for j in range(idx, len(lineas)):
        for ch in lineas[j]:
            if ch == "{":
                profundidad += 1
                abierto = True
            elif ch == "}":
                profundidad -= 1
                if abierto and profundidad <= 0:
                    return j
            elif ch == ";" and not abierto:
                return None  # cuerpo de una sola sentencia, sin llaves
    return None


def _reglas_bloque_js(lineas: list[str]) -> set[tuple[str, int]]:
    hallados: set[tuple[str, int]] = set()
    for idx, linea in enumerate(lineas):
        # while sin actualización ni salida
        m = _BUCLE_JS.search(linea)
        if m:
            fin = _fin_bloque_js(lineas, idx)
            if fin is not None:
                texto = "\n".join(lineas[idx : fin + 1])
                cuerpo = texto[texto.find("{") + 1 :]
                v = re.escape(m.group(1))
                actualiza = re.search(rf"\b{v}\s*(?:\+\+|--|[-+*/%]=|=(?!=))|(?:\+\+|--)\s*{v}\b", cuerpo)
                sale = re.search(r"\b(?:break|return|throw)\b", cuerpo)
                if not actualiza and not sale:
                    hallados.add(("bucle-infinito", idx + 1))

        # for...in que copia propiedades sin filtrar __proto__
        m = _PROTO_FOR.search(linea)
        if m:
            fin = _fin_bloque_js(lineas, idx)
            if fin is not None:
                cuerpo = "\n".join(lineas[idx : fin + 1])
                if not re.search(r"__proto__|hasOwn", cuerpo):
                    asigna = re.compile(rf"\w+\s*\[\s*{re.escape(m.group(1))}\s*\]\s*=(?!=)")
                    for j in range(idx, fin + 1):
                        if asigna.search(lineas[j]):
                            hallados.add(("prototipos", j + 1))
                            break

        # resultado de .find() usado sin comprobar
        m = _FIND.search(linea)
        if m:
            v = re.escape(m.group(1))
            guarda = re.compile(
                rf"\bif\s*\(\s*!?\s*{v}\b|\b{v}\s*(?:&&|\|\||\?\?)|\b{v}\s*\?\.|"
                rf"\b{v}\s*[!=]==?\s*(?:null|undefined)\b|\bthrow\b"
            )
            acceso = re.compile(rf"\b{v}\.\w")
            for j in range(idx + 1, min(idx + 13, len(lineas))):
                if guarda.search(lineas[j]):
                    break
                if acceso.search(lineas[j]):
                    hallados.add(("null-find", j + 1))
                    break
    return hallados


def _reglas_bloque_py(lineas: list[str]) -> set[tuple[str, int]]:
    hallados: set[tuple[str, int]] = set()
    for idx, linea in enumerate(lineas):
        m = _BUCLE_PY.search(linea)
        if not m:
            continue
        sangria = len(linea) - len(linea.lstrip())
        cuerpo_lineas: list[str] = []
        for j in range(idx + 1, len(lineas)):
            siguiente = lineas[j]
            if siguiente.strip() == "":
                cuerpo_lineas.append(siguiente)
                continue
            if len(siguiente) - len(siguiente.lstrip()) <= sangria:
                break
            cuerpo_lineas.append(siguiente)
        cuerpo = "\n".join(cuerpo_lineas)
        if not cuerpo.strip():
            continue
        v = re.escape(m.group(1))
        actualiza = re.search(rf"\b{v}\s*(?:[-+*/%]=|=(?!=))", cuerpo)
        sale = re.search(r"\b(?:break|return|raise)\b", cuerpo)
        if not actualiza and not sale:
            hallados.add(("bucle-infinito", idx + 1))
    return hallados

def _fin_llamada(lineas: list[str], idx: int, maximo: int = 20) -> int:
    """Índice de la línea donde se cierra el paréntesis de la llamada que abre la línea idx."""
    profundidad = 0
    abierto = False
    limite = min(idx + maximo, len(lineas))
    for j in range(idx, limite):
        for ch in _sin_cadenas(lineas[j]):
            if ch == "(":
                profundidad += 1
                abierto = True
            elif ch == ")":
                profundidad -= 1
                if abierto and profundidad <= 0:
                    return j
    return limite - 1


def _reglas_conexion(lineas: list[str]) -> set[tuple[str, int]]:
    """Contraseña literal (o vacía) dentro de una llamada de conexión a base de datos."""
    hallados: set[tuple[str, int]] = set()
    for idx, linea in enumerate(lineas):
        if not _LLAMADA_CONEXION.search(_sin_cadenas(linea)):
            continue
        for j in range(idx, _fin_llamada(lineas, idx) + 1):
            m = _PASSWORD_LIT.search(lineas[j])
            if not m:
                continue
            valor = m.group(2)
            if valor == "":
                hallados.add(("conexion-sin-password", j + 1))
            elif not valor.startswith(("$", "{", "%", "<")):
                hallados.add(("conexion-credenciales", j + 1))
    return hallados


def _reglas_sql_acumulado(lineas: list[str]) -> set[tuple[str, int]]:
    """sql += "..." + valor, cuando unas líneas antes hay SQL: la consulta se arma por partes."""
    hallados: set[tuple[str, int]] = set()
    for idx, linea in enumerate(lineas):
        if _SQL_ACUM.search(linea) and any(_SQL_PISTA.search(p) for p in lineas[max(0, idx - 30) : idx]):
            hallados.add(("sql-inyeccion", idx + 1))
    return hallados

# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------


def analizar(codigo: str, lenguaje: str) -> list[HallazgoRegla]:
    """Hallazgos de un archivo completo, con la línea real, ordenados por línea."""
    if lenguaje in JS:
        limpio = _quitar_comentarios_js(codigo)
    elif lenguaje == "py":
        limpio = _quitar_comentarios_py(codigo)
    else:
        return []

    lineas = [linea if len(linea) <= MAX_LINEA else "" for linea in limpio.splitlines()]

    encontrados: set[tuple[str, int]] = set()
    
    # 1. Reglas de una sola línea
    for id_regla, lenguajes, patron, ignorar_cadenas in PATRONES:
        if lenguaje not in lenguajes:
            continue
        for numero, linea in enumerate(lineas, start=1):
            texto = _sin_cadenas(linea) if ignorar_cadenas else linea
            if patron.search(texto):
                encontrados.add((id_regla, numero))

    # 2. Reglas de bloque
    if lenguaje in JS:
        encontrados.update(_reglas_bloque_js(lineas))
    elif lenguaje == "py":
        encontrados.update(_reglas_bloque_py(lineas))
    encontrados.update(_reglas_conexion(lineas))
    encontrados.update(_reglas_sql_acumulado(lineas))

    # Una credencial de conexión es más específica que "secreto": no se duplica en la misma línea
    for regla, numero in [e for e in encontrados if e[0] == "conexion-credenciales"]:
        encontrados.discard(("secreto", numero))

    # 3. Construcción del resultado
    resultado: list[HallazgoRegla] = []
    for id_regla, numero in sorted(encontrados, key=lambda e: (e[1], e[0])):
        tipo, severidad, descripcion = TABLA[id_regla]
        resultado.append(HallazgoRegla(id_regla, tipo, severidad, numero, descripcion))

    # 4. Reglas AST de Python
    if lenguaje == "py":
        tipo, severidad, descripcion = TABLA["variable-no-definida"]
        for numero, nombre in variables_sin_definir(codigo):
            resultado.append(
                HallazgoRegla("variable-no-definida", tipo, severidad, numero, descripcion.format(nombre=nombre))
            )

    return sorted(resultado, key=lambda h: (h.linea_codigo, h.regla))