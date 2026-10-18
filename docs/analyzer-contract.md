# Contrato del analyzer (backend ↔ Python/FastAPI)

Base: `http://localhost:8000` · El análisis es **asíncrono** (hay barra de progreso, HU-06): el backend lanza un trabajo y consulta su avance.

## Endpoints
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | `{ "analyzer": "ok", "ollama": "ok" }` |
| GET | `/modelos` | Modelos disponibles en Ollama |
| POST | `/analisis` | Crea un trabajo de análisis → `202` `{ "job_id": "abc123" }` |
| GET | `/analisis/{job_id}` | Estado, progreso y resultados |
| GET | `/modelos` | Modelos instalados y permitidos |
| POST | `/modelos/instalar` | Inicia la descarga de un modelo permitido → `202` |
| GET | `/modelos/instalar?modelo=...` | Estado de esa descarga |

### POST /analisis (entrada)
```json
{ "ruta_base": "D:\\Proyectos\\mi-api",
  "objetivo": "carpeta",
  "ruta_relativa": null,
  "modelo": "qwen2.5-coder",
  "lenguajes": ["js","ts","py"] }
```
`objetivo`: `"carpeta"` o `"archivo"` (en ese caso `ruta_relativa` es obligatoria).

### GET /analisis/{job_id} (salida)
```json
{ "estado": "completado",
  "progreso": { "procesados": 12, "total": 12 },
  "resultados": [
    { "ruta_relativa": "src/app.ts", "tipo": "vulnerabilidad", "severidad": "alta",
      "linea_codigo": 42, "descripcion": "Consulta SQL concatenada sin parametrizar." } ],
  "omitidos": [ { "ruta_relativa": "main.go", "motivo": "lenguaje no soportado" } ],
  "errores":  [ { "ruta_relativa": "src/x.js", "motivo": "respuesta JSON inválida tras 3 intentos" } ] }
```
`estado`: `en_proceso` · `completado` · `fallido`.

## Valores permitidos (deben coincidir con los CHECK de la BD)
- `tipo` (≤ 20 caracteres): `vulnerabilidad` · `mala_practica` · `refactorizacion`
- `severidad`: `baja` · `media` · `alta` · `critica`
- `linea_codigo`: entero ≥ 1
- `lenguaje`: `js` · `ts` · `py`

## Reglas del analyzer
1. **Filtro:** solo `.js`, `.ts`, `.py`. Ignora `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.venv`. Lo demás va a `omitidos` como "lenguaje no soportado".
2. **Solo lectura:** nunca escribe ni ejecuta nada del proyecto analizado.
3. **Prompt:** se le exige al modelo responder **solo JSON**: lista de `{tipo, descripcion, severidad, linea_codigo}`.
4. **JSON inválido** (común en modelos 7B): reintentar hasta 3 veces con un prompt más estricto. Si sigue fallando, el archivo va a `errores` y el análisis continúa con los demás.
5. **Normalización:** `linea_codigo` fuera de rango → se ajusta al rango del archivo; `severidad` o `tipo` desconocidos → se descarta el hallazgo.
6. **Archivos grandes:** se parten en bloques de ~200 líneas sumando el desplazamiento para que `linea_codigo` sea la línea real del archivo.
7. **Tiempo límite:** 120 s por archivo; si se excede, va a `errores`.
8. **Estado final:** `completado` si al menos un archivo se analizó; `fallido` si todos fallaron.

## Modelos
**GET /modelos** →
```json
{ "instalados": ["qwen2.5-coder:latest"], "permitidos": ["qwen2.5-coder", "llama3"] }
```
`permitidos` sale de `MODELOS_PERMITIDOS` (.env, separado por comas). Solo esos se pueden instalar.

**POST /modelos/instalar** body `{ "modelo": "llama3" }` → `202`
```json
{ "modelo": "llama3", "estado": "descargando", "progreso": { "completado": 0, "total": 0 } }
```
Si ya está instalado → `200` con `estado: "completado"`. Si ya se está descargando → `202` con el avance actual (idempotente).

**GET /modelos/instalar?modelo=llama3** →
```json
{ "modelo": "llama3", "estado": "descargando", "progreso": { "completado": 1200000, "total": 4700000000 } }
```
`estado`: `descargando` · `completado` · `fallido` (con `"motivo"`). `progreso` en bytes (viene de `/api/pull` de Ollama). Sin descarga registrada y no instalado → `404`.
El estado de la descarga vive en memoria del analyzer (se pierde al reiniciarlo).

## Errores
| Situación | Respuesta |
|---|---|
| Ollama apagado | `503` `{ "codigo": "OLLAMA_NO_DISPONIBLE" }` |
| Modelo no descargado | `400` `{ "codigo": "MODELO_NO_INSTALADO" }` |
| `ruta_base` inexistente | `400` `{ "codigo": "RUTA_INEXISTENTE" }` |
| `job_id` desconocido | `404` |
| Modelo fuera de `MODELOS_PERMITIDOS` | `400` `{ "codigo": "MODELO_NO_PERMITIDO" }` |

## Qué hace el backend con esto
Consulta `GET /analisis/{job_id}` cada 2 s, actualiza `Analisis.id_estado`, y al terminar guarda cada elemento de `resultados` en `Resultado` y crea su `ChecklistItem` en estado `pendiente`.

## Extensiones opcionales
`POST /documentacion` (HU-11) y `POST /pruebas` (HU-12): reciben `{ "ruta_base", "ruta_relativa", "modelo" }` y devuelven `{ "contenido": "..." }`.
