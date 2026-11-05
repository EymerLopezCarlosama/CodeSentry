"""Corpus de evaluación del motor de reglas.

Cada caso trae el código y los hallazgos que un revisor humano esperaría, como (regla, línea).
- Los casos "vulnerables" esperan hallazgos; los "seguros" esperan un conjunto vacío.
- Los casos con `limite` son límites CONOCIDOS del motor (falsos negativos o falsos positivos que se
  documentan en vez de ocultarse): cuentan en las métricas.
Este corpus es independiente de los fixtures con los que se desarrollaron las reglas.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Caso:
    nombre: str
    lenguaje: str
    codigo: str
    esperado: frozenset
    limite: str | None = None


def _c(nombre, lenguaje, codigo, *esperado, limite=None):
    return Caso(nombre, lenguaje, codigo.strip("\n") + "\n", frozenset(esperado), limite)


CASOS: list[Caso] = [
    # ---------- vulnerables: deben detectarse ----------
    _c("js eval", "js", """
function run(input) {
  return eval(input);
}
""", ("eval", 2)),
    _c("js sql concatenado", "js", """
function find(db, id) {
  const q = "SELECT * FROM items WHERE id = " + id;
  return db.query(q);
}
""", ("sql-inyeccion", 2)),
    _c("py shell=True", "py", """
import subprocess

def listar(carpeta):
    return subprocess.check_output("ls " + carpeta, shell=True)
""", ("cmd-shell", 4)),
    _c("py pickle", "py", """
import pickle

def cargar(blob):
    return pickle.loads(blob)
""", ("deserializacion", 4)),
    _c("ts secreto", "ts", """
const API_KEY = "abcd1234efgh5678";
""", ("secreto", 1)),
    _c("js ruta concatenada", "js", """
function leer(name) {
  const filePath = "/var/data/" + name;
  return filePath;
}
""", ("ruta-concatenada", 2)),
    _c("js bucle infinito", "js", """
let i = 0;
while (i < items.length) {
  console.log(items[i]);
}
""", ("bucle-infinito", 2)),
    _c("py default mutable", "py", """
def add(item, lst=[]):
    lst.append(item)
    return lst
""", ("default-mutable", 1)),
    _c("py variable no definida", "py", """
def f(c):
    if c:
        x = 1
    return x
""", ("variable-no-definida", 4)),
    _c("js off-by-one", "js", """
for (let i = 0; i <= arr.length; i++) {
  total += arr[i];
}
""", ("off-by-one", 1)),
    _c("js tls desactivado", "js", """
const opciones = { rejectUnauthorized: false };
""", ("tls-desactivado", 1)),
    _c("py hash md5", "py", """
import hashlib
h = hashlib.md5(pwd.encode()).hexdigest()
""", ("hash-debil", 2)),
    _c("js credenciales de conexion", "js", """
const db = mysql.createConnection({
  host: "localhost",
  password: "Clave12345",
});
""", ("conexion-credenciales", 3)),
    # ---------- seguros: no deben generar hallazgos ----------
    _c("js consulta parametrizada", "js", """
function find(db, id) {
  return db.query("SELECT * FROM items WHERE id = ?", [id]);
}
"""),
    _c("py consulta parametrizada", "py", """
def find(cursor, uid):
    cursor.execute("SELECT * FROM t WHERE id = %s", (uid,))
"""),
    _c("py subprocess con lista", "py", """
import subprocess
subprocess.run(["ls", carpeta], shell=False, check=True)
"""),
    _c("py json en vez de pickle", "py", """
import json
data = json.loads(blob)
"""),
    _c("js secreto desde entorno", "js", """
const key = process.env.API_KEY;
"""),
    _c("py open con with", "py", """
def leer(p):
    with open(p) as f:
        return f.read()
"""),
    _c("js bucle con incremento", "js", """
let i = 0;
while (i < items.length) {
  console.log(items[i]);
  i++;
}
"""),
    _c("ts tipado sin any", "ts", """
interface User { id: number; name: string }
export function nombre(u: User): string {
  return u.name;
}
"""),
    _c("py variable inicializada", "py", """
def f(c):
    x = None
    if c:
        x = 1
    return x
"""),
    _c("js igualdad estricta", "js", """
if (a === b) { run(); }
"""),
    # ---------- límites conocidos (se documentan, no se esconden) ----------
    _c("eval por alias", "js", """
const ejecutar = eval;
ejecutar(codigo);
""", ("eval", 1), limite="FN: el motor busca la llamada eval(...), no el alias"),
    _c("sql armado con join", "js", """
const partes = ["SELECT * FROM t WHERE id = ", id];
db.query(partes.join(""));
""", ("sql-inyeccion", 2), limite="FN: la consulta se arma sin + ni ${}"),
    _c("update dinamico con fragmentos fijos", "js", """
const campos = ["nombre = ?", "ruta = ?"];
const sql = `UPDATE Proyecto SET ${campos.join(", ")} WHERE id = ?`;
""", limite="FP: interpolación de fragmentos fijos (se silencia con codesentry-ignore)"),
]