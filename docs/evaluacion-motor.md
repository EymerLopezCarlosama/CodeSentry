# Evaluación del motor de reglas

Corpus: 26 casos. Hallazgos correctos (TP): 13 · falsos positivos (FP): 1 · falsos negativos (FN): 2.

**Precisión global: 93 % · Recall global: 87 %**

| Regla | TP | FP | FN | Precisión | Recall |
|---|---|---|---|---|---|
| bucle-infinito | 1 | 0 | 0 | 100 % | 100 % |
| cmd-shell | 1 | 0 | 0 | 100 % | 100 % |
| conexion-credenciales | 1 | 0 | 0 | 100 % | 100 % |
| default-mutable | 1 | 0 | 0 | 100 % | 100 % |
| deserializacion | 1 | 0 | 0 | 100 % | 100 % |
| eval | 1 | 0 | 1 | 100 % | 50 % |
| hash-debil | 1 | 0 | 0 | 100 % | 100 % |
| off-by-one | 1 | 0 | 0 | 100 % | 100 % |
| ruta-concatenada | 1 | 0 | 0 | 100 % | 100 % |
| secreto | 1 | 0 | 0 | 100 % | 100 % |
| sql-inyeccion | 1 | 1 | 1 | 50 % | 50 % |
| tls-desactivado | 1 | 0 | 0 | 100 % | 100 % |
| variable-no-definida | 1 | 0 | 0 | 100 % | 100 % |

## Límites conocidos (casos con fallo)
| Caso | Falso positivo | Falso negativo | Nota |
|---|---|---|---|
| eval por alias | — | [('eval', 1)] | FN: el motor busca la llamada eval(...), no el alias |
| sql armado con join | — | [('sql-inyeccion', 2)] | FN: la consulta se arma sin + ni ${} |
| update dinamico con fragmentos fijos | [('sql-inyeccion', 2)] | — | FP: interpolación de fragmentos fijos (se silencia con codesentry-ignore) |
