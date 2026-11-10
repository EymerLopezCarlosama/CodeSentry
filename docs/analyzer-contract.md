# Contrato del analyzer (backend ↔ Python/FastAPI)

Base: `http://localhost:8000` · El análisis es **asíncrono** (hay barra de progreso, HU-06): el backend lanza un trabajo y consulta su avance.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | `{ "analyzer": "ok", "ollama": "ok" }` |
| GET | `/modelos` | Modelos disponibles en Ollama |
| GET | `/reglas` | Reglas disponibles en el analyzer |
| POST | `/analisis` | Crea un trabajo de análisis → `202` `{ "job_id": "abc123" }` |
| GET | `/analisis/{job_id}` | Estado, progreso y resultados |
| GET | `/modelos` | Modelos instalados y permitidos |
| POST | `/modelos/instalar` | Inicia la descarga de un modelo permitido → `202` |
| GET | `/modelos/instalar?modelo=...` | Estado de esa descarga |
| POST | `/escaneo` | Cuenta archivos por lenguaje de una carpeta, antes de registrarla |

### POST /analisis (entrada)

```json
{
  "ruta_base": "D:\\Proyectos\\mi-api",
  "objetivo": "carpeta",
  "ruta_relativa": null,
  "modelo": "qwen2.5-coder",
  "lenguajes": ["js", "ts", "py"],
  "ejemplos": { "eval": ["La línea evalúa texto recibido; use JSON.parse."] }
}
```

`objetivo`: `"carpeta"` o `"archivo"` (en ese caso `ruta_relativa` es obligatoria).

"ejemplos (opcional): explicaciones que el equipo aceptó antes, por id de regla. El analyzer usa hasta 2 por regla como ejemplo de estilo al pedir la explicación y descarta las iguales a la descripción fija. No cambia qué se detecta ni cómo se clasifica."

### GET /analisis/{job_id} (salida)

```json
{
  "estado": "completado",
  "progreso": {
    "procesados": 12,
    "total": 12
  },
  "resultados": [
    {
      "ruta_relativa": "src/app.ts",
      "regla": "sql-inyeccion",
      "tipo": "vulnerabilidad",
      "severidad": "alta",
      "linea_codigo": 42,
      "descripcion": "Consulta SQL concatenada sin parametrizar."
    }
  ],
  "omitidos": [
    {
      "ruta_relativa": "main.go",
      "motivo": "lenguaje no soportado"
    }
  ],
  "errores": [
    {
      "ruta_relativa": "src/x.js",
      "motivo": "respuesta JSON inválida tras 3 intentos"
    }
  ],
  "explicaciones_ia": 12
}
```

`estado`: `en_proceso` · `completado` · `fallido`.

`explicaciones_ia`: cuántas descripciones redactó la IA local (el resto usa la descripción fija de la tabla).

`progreso` cuenta pasos: uno por archivo analizado y uno por cada explicación pedida a la IA.

### GET /reglas (salida)

```json
{
  "reglas": [
    {
      "regla": "sql-inyeccion",
      "tipo": "vulnerabilidad",
      "severidad": "alta",
      "descripcion": "Consulta SQL concatenada sin parametrizar."
    }
  ]
}
```

## Valores permitidos (deben coincidir con los CHECK de la BD)

- `tipo` (≤ 20 caracteres): `vulnerabilidad` · `mala_practica` · `refactorizacion`
- `severidad`: `baja` · `media` · `alta` · `critica`
- `linea_codigo`: entero ≥ 1
- `lenguaje`: `js` · `ts` · `py`

## Reglas del analyzer

1. **Filtro:** solo `.js`, `.jsx`, `.ts`, `.tsx`, `.py` (`.jsx` cuenta como `js` y `.tsx` como `ts`). Ignora `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.venv`. Lo demás va a `omitidos` como "lenguaje no soportado".

2. **Solo lectura:** nunca escribe ni ejecuta nada del proyecto analizado.

3. **Detección:** motor de reglas estáticas (patrones de texto y, en Python, el árbol sintáctico). Cada regla da la línea exacta y el tipo y la severidad salen de una tabla fija: el modelo no detecta ni clasifica.

4. **Explicaciones con IA:** para los hallazgos más graves (hasta `EXPLICACIONES_MAX`, 25 por defecto; `0` las desactiva) el modelo local redacta una explicación breve sobre ese código. Si Ollama está apagado, el modelo no está instalado o la respuesta no sirve, se usa la descripción fija: **el análisis nunca falla por la IA**.

5. **Cortes de seguridad:** cada llamada al modelo tiene tope de tokens y de 120 s; la fase de explicaciones tiene un presupuesto de 5 minutos; tras 3 respuestas inútiles seguidas se deja de usar la IA.

8. **Estado final:** `completado` si al menos un archivo se analizó; `fallido` si todos fallaron.

## Modelos

**GET /modelos** →

```json
{
  "instalados": ["qwen2.5-coder:latest"],
  "permitidos": ["qwen2.5-coder", "llama3"]
}
```

`permitidos` sale de `MODELOS_PERMITIDOS` (.env, separado por comas). Solo esos se pueden instalar.

**POST /modelos/instalar** body `{ "modelo": "llama3" }` → `202`

```json
{
  "modelo": "llama3",
  "estado": "descargando",
  "progreso": {
    "completado": 0,
    "total": 0
  }
}
```

Si ya está instalado → `200` con `estado: "completado"`. Si ya se está descargando → `202` con el avance actual (idempotente).

**GET /modelos/instalar?modelo=llama3** →

```json
{
  "modelo": "llama3",
  "estado": "descargando",
  "progreso": {
    "completado": 1200000,
    "total": 4700000000
  }
}
```

`estado`: `descargando` · `completado` · `fallido` (con `"motivo"`). `progreso` en bytes (viene de `/api/pull` de Ollama). Sin descarga registrada y no instalado → `404`.

El estado de la descarga vive en memoria del analyzer (se pierde al reiniciarlo).

## Escaneo de lenguajes

**POST /escaneo** body `{ "ruta_base": "D:\\Proyectos\\mi-api" }` → `200`

```json
{
  "soportados": {
    "JavaScript": 42,
    "Python": 7
  },
  "no_soportados": {
    "Java": 12,
    "PHP": 3
  },
  "total_archivos": 190,
  "truncado": false
}
```

- `soportados`: lenguajes que el analyzer analiza (JavaScript, TypeScript, Python), con el número de archivos.
- `no_soportados`: lenguajes de código reconocidos pero fuera del alcance. Lo que no es código (.txt, .json, imágenes) no se cuenta.
- Ignora las mismas carpetas que el análisis (`node_modules`, `.git`, `dist`, ...). Solo lectura.
- Topes: 20 000 archivos o 10 s. Si se alcanza uno, `truncado: true` y los conteos son parciales.
- `ruta_base` inexistente → `400 RUTA_INEXISTENTE`.

## Errores

| Situación | Respuesta |
|---|---|
| `ruta_base` inexistente | `400` `{ "codigo": "RUTA_INEXISTENTE" }` |
| `job_id` desconocido | `404` |
| Modelo fuera de `MODELOS_PERMITIDOS` | `400` `{ "codigo": "MODELO_NO_PERMITIDO" }` |

Los errores `OLLAMA_NO_DISPONIBLE` y `MODELO_NO_INSTALADO` siguen siendo válidos para los endpoints de modelos.

## Qué hace el backend con esto

Consulta `GET /analisis/{job_id}` cada 2 s, actualiza `Analisis.id_estado`, y al terminar guarda cada elemento de `resultados` en `Resultado` y crea su `ChecklistItem` en estado `pendiente`.

## Extensiones opcionales

`POST /documentacion` (HU-11): recibe `{ "ruta_base", "ruta_relativa", "modelo"? }` y devuelve
`{ "contenido": "# archivo\n\n## Resumen ...", "aviso": null | "..." }`. El contenido es un documento Markdown con un resumen y los
docstrings (Python) o JSDoc (JS y TS) propuestos para cada función o clase.

`POST /pruebas` (HU-12): recibe `{ "ruta_base", "ruta_relativa", "modelo"? }` y devuelve
`{ "framework": "jest" | "pytest", "contenido": "...", "aviso": null | "..." }`.

Los dos: solo lectura, solo .js/.ts/.py; archivos de más de 300 líneas se cortan y `aviso` lo indica. El prompt pide no inventar
funciones ni modificar la lógica. Si la respuesta no tiene el formato esperado se reintenta una vez con un prompt más estricto.

Errores, con cuerpo `{ "codigo", "mensaje" }` (el mensaje habla de "pruebas" o de "documentación" según el endpoint):
`400 RUTA_INEXISTENTE`, `400 ARCHIVO_INEXISTENTE`, `400 ARCHIVO_FUERA_DE_RUTA`, `400 LENGUAJE_NO_SOPORTADO`,
`400 ARCHIVO_ILEGIBLE`, `400 ARCHIVO_VACIO`, `400 MODELO_NO_INSTALADO` · `503 OLLAMA_NO_DISPONIBLE` ·
`504 OLLAMA_TIEMPO_EXCEDIDO` · `502 RESPUESTA_INVALIDA` (el modelo no devolvió un resultado válido tras 2 intentos).
