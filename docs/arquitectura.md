# Arquitectura
frontend (React/TS) → backend (Node/TS, MySQL) → analyzer (Python/FastAPI) → Ollama (localhost:11434)
Todo corre en la máquina del usuario; ningún código sale del equipo.

## Motor híbrido
1. **Detección** (`analyzer/app/services/reglas.py` y `reglas_ast.py`): reglas estáticas deterministas. Cada regla da la línea exacta; el tipo, la severidad, el CWE y la característica ISO/IEC 25010 salen de tablas fijas. El mismo código produce siempre el mismo resultado.
2. **Explicación** (`analyzer/app/services/explicacion.py`): la IA local redacta una o dos frases sobre ese código, con hasta 2 explicaciones aceptadas antes como ejemplo de estilo. Si Ollama no está disponible se usa la descripción fija: el análisis nunca falla por la IA.
3. **Mejora continua**: el checklist (aceptada o rechazada, con motivo) alimenta `GET /reglas/estadisticas`. El sistema solo sugiere; nunca cambia una regla por su cuenta.
4. **Extensiones opcionales**: documentación (HU-11) y casos de prueba (HU-12) con la IA local. Solo devuelven texto para copiar o descargar; nunca escriben en el proyecto del usuario.

## Por qué es híbrido
Se probó el modelo local (7B) como detector: <completar con la prueba: N hallazgos, M útiles>. No era reproducible ni suficientemente preciso, mientras que como redactor aporta valor sin comprometer la fiabilidad.
