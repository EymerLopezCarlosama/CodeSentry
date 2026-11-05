"""Mide precisión y recall del motor de reglas sobre tests/corpus_evaluacion.py.

Uso (desde analyzer/):
    python -m tests.evaluacion                                   # tabla de métricas en pantalla
    python -m tests.evaluacion --salida ../docs/evaluacion-motor.md
    python -m tests.evaluacion --catalogo --salida ../docs/reglas.md
"""

import argparse
from collections import defaultdict

from app.services.reglas import analizar, catalogo
from tests.corpus_evaluacion import CASOS


def _razon(tp: int, fp: int, fn: int):
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn) if tp + fn else None
    return precision, recall


def medir() -> dict:
    por_regla = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})
    total = {"tp": 0, "fp": 0, "fn": 0}
    detalle = []
    for caso in CASOS:
        detectado = {(h.regla, h.linea_codigo) for h in analizar(caso.codigo, caso.lenguaje)}
        tp, fp, fn = detectado & caso.esperado, detectado - caso.esperado, caso.esperado - detectado
        for clave, conjunto in (("tp", tp), ("fp", fp), ("fn", fn)):
            total[clave] += len(conjunto)
            for regla, _ in conjunto:
                por_regla[regla][clave] += 1
        if fp or fn:
            detalle.append((caso, sorted(fp), sorted(fn)))
    precision, recall = _razon(**total)
    return {"total": {**total, "precision": precision, "recall": recall}, "por_regla": dict(por_regla), "detalle": detalle}


def _pct(valor) -> str:
    return "—" if valor is None else f"{valor * 100:.0f} %"


def tabla_metricas() -> str:
    m = medir()
    t = m["total"]
    filas = [
        f"# Evaluación del motor de reglas\n",
        f"Corpus: {len(CASOS)} casos. Hallazgos correctos (TP): {t['tp']} · falsos positivos (FP): {t['fp']} · "
        f"falsos negativos (FN): {t['fn']}.\n",
        f"**Precisión global: {_pct(t['precision'])} · Recall global: {_pct(t['recall'])}**\n",
        "| Regla | TP | FP | FN | Precisión | Recall |",
        "|---|---|---|---|---|---|",
    ]
    for regla, v in sorted(m["por_regla"].items()):
        p, r = _razon(v["tp"], v["fp"], v["fn"])
        filas.append(f"| {regla} | {v['tp']} | {v['fp']} | {v['fn']} | {_pct(p)} | {_pct(r)} |")
    filas += ["", "## Límites conocidos (casos con fallo)", "| Caso | Falso positivo | Falso negativo | Nota |", "|---|---|---|---|"]
    for caso, fp, fn in m["detalle"]:
        filas.append(f"| {caso.nombre} | {fp or '—'} | {fn or '—'} | {caso.limite or 'SIN DOCUMENTAR'} |")
    return "\n".join(filas) + "\n"


def tabla_catalogo() -> str:
    filas = ["# Catálogo de reglas\n", "| Regla | Tipo | Severidad | CWE | ISO/IEC 25010 | Descripción |", "|---|---|---|---|---|---|"]
    for r in catalogo():
        filas.append(f"| {r['id']} | {r['tipo']} | {r['severidad']} | {r['cwe'] or '—'} | {r['iso25010']} | {r['descripcion']} |")
    return "\n".join(filas) + "\n"


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalogo", action="store_true")
    ap.add_argument("--salida")
    a = ap.parse_args()
    texto = tabla_catalogo() if a.catalogo else tabla_metricas()
    if a.salida:
        with open(a.salida, "w", encoding="utf-8") as f:
            f.write(texto)
    else:
        print(texto)