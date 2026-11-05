# Validación del analizador sobre su propio repositorio

Se ejecutó CodeSentry sobre su propio código (dogfooding) antes y después de los ajustes del motor.

| Métrica | Análisis #26 (antes) | Análisis nuevo (después) |
|---|---|---|
| Hallazgos totales | 40 | 0 |
| Críticos | 11 | 0 |
| Altos | 15 | 0 |
| Medios | 9 | 0 |
| Bajos | 5 | 0 |
| En fixtures (intencionales) | 19 | Excluidos |
| En archivos de prueba | 19 | Excluidos |
| En código fuente | 2 | 0 |

Los 2 hallazgos de código fuente del análisis #26 fueron falsos positivos: el texto de la descripción de una regla (reglas.py) y el UPDATE dinámico de proyectos.repository.ts, cuyo fragmento SET se arma con literales fijos. El primero se resolvió ignorando cadenas en la regla cmd-shell; el segundo, con un comentario codesentry-ignore que deja constancia de la revisión.

Lección: un análisis estático necesita excluir sus propias pruebas y una forma explícita y trazable de silenciar lo ya revisado, como # nosec en Bandit o // eslint-disable en ESLint.