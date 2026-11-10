# Mapeo de normas y estándares

CodeSentry es un motor híbrido: reglas estáticas detectan y clasifican (reproducible), la IA local explica y el checklist del desarrollador alimenta la mejora continua.

## Grupo 1: normas de producto (calidad del software analizado)
| Norma | Dónde se aplica | Evidencia |
|---|---|---|
| ISO/IEC 25010 (SQuaRE; sucesora de ISO 9126) | Cada regla se asocia a Seguridad, Fiabilidad o Mantenibilidad (`METADATOS` en `reglas.py`) | `docs/reglas.md` |
| ISO/IEC 25000 | Resultados organizados por archivo y severidad; reportes con totales | Reportes pdf, html y json |
| ISO/IEC 14598 | Flujo de evaluación: SolicitudRevision, Analisis, Resultado, Reporte | Modelo de datos |
| IEEE 730 | Verificación y validación con evidencia: reportes y checklist | Reporte, ChecklistItem |
| CWE (taxonomía de MITRE; no es una norma ISO) | Cada regla de seguridad referencia su debilidad | `docs/reglas.md` |

## Grupo 2: normas de proceso
| Norma | Dónde se aplica | Evidencia |
|---|---|---|
| ISO 9001 | Ciclo PHVA: registrar y delimitar (Planear), analizar (Hacer), resultados y métricas (Verificar), checklist y estadísticas (Actuar). Confidencialidad: ejecución 100 % local | Flujo de la aplicación |
| CMMI nivel 4 | Gestión cuantitativa: aceptación y precisión estimada por regla, con muestra mínima | `GET /reglas/estadisticas`, dashboard |
| ISO/IEC 12207 | Procesos de implementación: análisis de código (HU-06), documentación (HU-11) y pruebas (HU-12) | HU-06, HU-11, HU-12 |
| ISO/IEC 15504 (SPICE) | Evaluar la eficacia de los procesos: `modelo_ia_usado` por análisis y corpus de evaluación del motor | `docs/evaluacion-motor.md` |
| ISO/IEC 20000 | Servicio interno disponible: centro de arranque, `/salud` y verificación de requisitos | `launcher/` |
| MODS | Optimizar el flujo de revisión detectando errores en etapas tempranas | Uso general |
