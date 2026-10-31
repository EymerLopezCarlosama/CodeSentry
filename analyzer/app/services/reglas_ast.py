"""Reglas basadas en el árbol sintáctico de Python (módulo ast).

Detecta variables que solo se asignan en algunas ramas y se usan después (UnboundLocalError posible).
Conservador: ante la duda no marca. Solo lectura: analiza el árbol, nunca ejecuta el código.
"""

import ast
import warnings

_ALCANCES = (ast.FunctionDef, ast.AsyncFunctionDef, ast.Lambda, ast.ClassDef)
_DEFINEN_NOMBRE = (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)
_TERMINAN = (ast.Return, ast.Raise, ast.Continue, ast.Break)
_BUCLES = (ast.For, ast.AsyncFor, ast.While)
_TRY = (ast.Try,) + ((ast.TryStar,) if hasattr(ast, "TryStar") else ())
_MATCH = (ast.Match,) if hasattr(ast, "Match") else ()
_CAPTURAS = tuple(getattr(ast, n) for n in ("MatchAs", "MatchStar", "MatchMapping") if hasattr(ast, n))


def _recorrer(nodo: ast.AST):
    """Nodos del subárbol sin entrar en funciones, lambdas ni clases anidadas (sí devuelve esos nodos)."""
    pila = [nodo]
    while pila:
        actual = pila.pop()
        yield actual
        if isinstance(actual, _ALCANCES):
            continue
        pila.extend(ast.iter_child_nodes(actual))


def _asignados(nodos: list[ast.AST]) -> set[str]:
    """Nombres que estos nodos asignan o eliminan (en el mismo alcance)."""
    nombres: set[str] = set()
    for nodo in nodos:
        for n in _recorrer(nodo):
            if isinstance(n, ast.Name) and isinstance(n.ctx, (ast.Store, ast.Del)):
                nombres.add(n.id)
            elif isinstance(n, _DEFINEN_NOMBRE):
                nombres.add(n.name)
            elif isinstance(n, (ast.Import, ast.ImportFrom)):
                for alias in n.names:
                    nombres.add((alias.asname or alias.name).split(".")[0])
            elif isinstance(n, ast.ExceptHandler) and n.name:
                nombres.add(n.name)
            elif isinstance(n, _CAPTURAS):
                for atributo in ("name", "rest"):
                    valor = getattr(n, atributo, None)
                    if isinstance(valor, str):
                        nombres.add(valor)
    return nombres


def _cargas(nodo: ast.AST) -> list[tuple[str, int]]:
    """(nombre, línea) de cada lectura de una variable, en orden de aparición."""
    encontradas: list[tuple[int, int, str]] = []
    for n in _recorrer(nodo):
        if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Load):
            encontradas.append((n.lineno, n.col_offset, n.id))
        elif isinstance(n, ast.AugAssign) and isinstance(n.target, ast.Name):
            encontradas.append((n.target.lineno, n.target.col_offset, n.target.id))  # x += 1 también lee x
    return [(nombre, linea) for linea, _, nombre in sorted(encontradas)]


class _Analizador:
    def __init__(self, funcion: ast.FunctionDef | ast.AsyncFunctionDef) -> None:
        argumentos = funcion.args
        parametros = [a.arg for a in argumentos.posonlyargs + argumentos.args + argumentos.kwonlyargs]
        if argumentos.vararg:
            parametros.append(argumentos.vararg.arg)
        if argumentos.kwarg:
            parametros.append(argumentos.kwarg.arg)
        self.parametros = set(parametros)
        self.encontrados: dict[str, int] = {}  # nombre -> primera línea donde se usa
        self.ignorar: set[str] = set()  # nombres sobre los que no se opina
        for sentencia in funcion.body:
            for n in _recorrer(sentencia):
                if isinstance(n, (ast.Global, ast.Nonlocal)):
                    self.ignorar.update(n.names)

    def _revisar(self, nodo: ast.AST, definidas: set[str], posibles: set[str]) -> None:
        for nombre, linea in _cargas(nodo):
            if nombre in posibles and nombre not in definidas and nombre not in self.ignorar:
                self.encontrados.setdefault(nombre, linea)

    def procesar(
        self, sentencias: list[ast.stmt], definidas: set[str], posibles: set[str]
    ) -> tuple[set[str], set[str], bool]:
        """Devuelve (definidas en todos los caminos, definidas solo en algunos, ¿el bloque termina?).
        Trabaja sobre copias: no modifica los conjuntos recibidos."""
        definidas, posibles = set(definidas), set(posibles)
        for s in sentencias:
            if isinstance(s, ast.If):
                self._revisar(s.test, definidas, posibles)
                d1, p1, t1 = self.procesar(s.body, definidas, posibles)
                d2, p2, t2 = self.procesar(s.orelse, definidas, posibles)
                if t1 and t2:
                    return definidas, posibles, True
                if t1:
                    definidas, posibles = d2, p2
                elif t2:
                    definidas, posibles = d1, p1
                else:
                    ambas = d1 & d2
                    posibles = (d1 | p1 | d2 | p2) - ambas
                    definidas = ambas

            elif isinstance(s, _BUCLES):
                self._revisar(s.test if isinstance(s, ast.While) else s.iter, definidas, posibles)
                self.procesar(s.body, definidas, posibles)
                self.procesar(s.orelse, definidas, posibles)
                self.ignorar |= _asignados([s])  # el bucle puede no ejecutarse: no se opina

            elif isinstance(s, _TRY):
                bloques = [s.body, *[h.body for h in s.handlers], s.orelse, s.finalbody]
                for bloque in bloques:
                    self.procesar(bloque, definidas, posibles)
                self.ignorar |= _asignados([s])

            elif isinstance(s, _MATCH):
                self._revisar(s.subject, definidas, posibles)
                for caso in s.cases:
                    self.procesar(caso.body, definidas, posibles)
                self.ignorar |= _asignados([s])

            elif isinstance(s, (ast.With, ast.AsyncWith)):
                for item in s.items:
                    self._revisar(item.context_expr, definidas, posibles)
                    if item.optional_vars is not None:
                        nuevas = _asignados([item.optional_vars])
                        definidas |= nuevas
                        posibles -= nuevas
                definidas, posibles, termina = self.procesar(s.body, definidas, posibles)
                if termina:
                    return definidas, posibles, True

            elif isinstance(s, _DEFINEN_NOMBRE):
                definidas.add(s.name)
                posibles.discard(s.name)

            elif isinstance(s, ast.Delete):
                self.ignorar |= _asignados([s])

            else:
                self._revisar(s, definidas, posibles)
                nuevas = _asignados([s])
                definidas |= nuevas
                posibles -= nuevas
                if isinstance(s, _TERMINAN):
                    return definidas, posibles, True
        return definidas, posibles, False


def variables_sin_definir(codigo: str) -> list[tuple[int, str]]:
    """[(línea del primer uso, nombre)] de variables asignadas solo en algunas ramas y usadas después.
    Devuelve [] si el código no se puede interpretar (archivo a medias, sintaxis de otra versión)."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            arbol = ast.parse(codigo)
    except (SyntaxError, ValueError, RecursionError, MemoryError):
        return []

    hallazgos: list[tuple[int, str]] = []
    for nodo in ast.walk(arbol):
        if isinstance(nodo, (ast.FunctionDef, ast.AsyncFunctionDef)):
            analizador = _Analizador(nodo)
            analizador.procesar(nodo.body, analizador.parametros, set())
            hallazgos.extend((linea, nombre) for nombre, linea in analizador.encontrados.items())
    return sorted(hallazgos)