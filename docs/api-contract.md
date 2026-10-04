# Contrato de la API (frontend ↔ backend)

Base: `http://localhost:3001/api` · Formato: JSON · Fechas: `YYYY-MM-DD`

**Error estándar** (todas las rutas):
```json
{ "error": { "codigo": "RUTA_DUPLICADA", "mensaje": "Esa carpeta ya está registrada." } }
```
Códigos HTTP: 400 datos inválidos · 404 no existe · 409 conflicto · 502 analyzer/Ollama caído · 500 error interno.

---
## Proyectos (HU-01 a HU-04)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/proyectos` | Lista de proyectos (HU-02) |
| GET | `/proyectos/:id` | Detalle de un proyecto |
| POST | `/proyectos` | Registrar proyecto (HU-01) |
| PUT | `/proyectos/:id` | Actualizar configuración (HU-03) |
| DELETE | `/proyectos/:id` | Eliminar registro (HU-04) |

**Proyecto (respuesta):**
```json
{ "id_proyecto": 1, "nombre": "Mi API", "ruta_carpeta": "D:\\Proyectos\\mi-api",
  "modelo_ia": "qwen2.5-coder", "lenguajes": ["JavaScript","TypeScript"],
  "fecha_registro": "2026-10-04", "fecha_actualizacion": null, "estado": "activo" }
```
**POST /proyectos** body: `{ "nombre", "ruta_carpeta", "lenguajes": ["JavaScript"], "modelo_ia"? }` → `201` + proyecto.
Errores: `400 RUTA_INEXISTENTE` · `409 RUTA_DUPLICADA`.
**PUT /proyectos/:id** body: cualquiera de los campos anteriores → `200` + proyecto.
**DELETE /proyectos/:id** → `204`. Solo borra el registro en BD (cascada a sus solicitudes), **nunca** archivos del disco. El frontend pide confirmación antes de llamar.

## Archivos del proyecto (apoyo a HU-05)
| GET | `/proyectos/:id/archivos` | Archivos soportados (.js/.ts/.py) detectados, ignorando node_modules y .git |
|---|---|---|
```json
[ { "id_archivo": 10, "nombre_archivo": "app.ts", "ruta_relativa": "src/app.ts", "lenguaje": "ts" } ]
```

## Revisiones (HU-05)
**POST `/revisiones`** body:
```json
{ "id_proyecto": 1, "tipo_objetivo": "carpeta" }
{ "id_proyecto": 1, "tipo_objetivo": "archivo", "id_archivo": 10 }
```
→ `202`: `{ "id_solicitud": 5, "id_analisis": 7, "estado": "pendiente" }`
Crea la SolicitudRevision y un Analisis en estado `pendiente`, y dispara el escaneo en segundo plano.

## Análisis (HU-06)
**GET `/analisis/:id`** →
```json
{ "id_analisis": 7, "estado": "en_proceso", "modelo_ia_usado": "qwen2.5-coder",
  "fecha_analisis": "2026-10-04", "progreso": { "procesados": 3, "total": 12 } }
```
`estado`: `pendiente` · `en_proceso` · `completado` · `fallido`. El frontend consulta cada 2 s mientras no sea `completado`/`fallido`.
`progreso` no se guarda en BD: el backend lo mantiene en memoria mientras corre el análisis.

## Resultados (HU-07)
**GET `/analisis/:id/resultados?severidad=alta`** (filtro opcional) →
```json
{ "estado": "completado",
  "archivos": [ { "ruta_relativa": "src/app.ts",
    "hallazgos": [ { "id_resultado": 31, "tipo": "vulnerabilidad", "severidad": "alta",
      "linea_codigo": 42, "descripcion": "...", "estado_checklist": "pendiente" } ] } ] }
```
Hallazgos ordenados por severidad (critica → baja). Si el análisis no terminó: `archivos: []` y el `estado` real, no un error.

## Checklist (HU-09)
| GET | `/analisis/:id/checklist` | Items con código afectado, recomendación y estado |
|---|---|---|
| PATCH | `/checklist/:id` | body `{ "estado": "aceptada" \| "rechazada" \| "pendiente" }` → `200` + item |

El backend actualiza `ChecklistItem.id_estado` y `fecha_marcado`. Los ChecklistItem se crean en `pendiente` al guardar cada Resultado.

## Reportes (HU-08)
| POST | `/analisis/:id/reportes` | body `{ "formato": "pdf" \| "html" \| "json" }` → `201` `{ "id_reporte", "formato", "ruta_archivo" }` |
|---|---|---|
| GET | `/analisis/:id/reportes` | Reportes ya generados |
| GET | `/reportes/:id/descargar` | Descarga el archivo |

Contenido: total de hallazgos, distribución por severidad y por archivo, fecha del análisis.

## Dashboard (HU-10)
**GET `/dashboard`** →
```json
{ "totales": { "proyectos": 3, "analisis": 8, "hallazgos": 120 },
  "por_severidad": { "baja": 40, "media": 50, "alta": 25, "critica": 5 },
  "checklist": { "pendiente": 70, "aceptada": 30, "rechazada": 20 },
  "por_proyecto": [ { "id_proyecto": 1, "nombre": "Mi API", "hallazgos": 60, "aceptadas": 15, "rechazadas": 5 } ] }
```

## Utilidades
| GET | `/salud` | `{ "backend": "ok", "base_datos": "ok", "analyzer": "ok", "ollama": "ok" }` |
|---|---|---|
| GET | `/modelos` | Modelos instalados en Ollama (para el selector de HU-03) |

## Extensiones opcionales
| POST | `/archivos/:id/documentacion` | HU-11 → `{ "contenido": "..." }` |
|---|---|---|
| POST | `/archivos/:id/pruebas` | HU-12 → `{ "framework": "jest", "contenido": "..." }` |

---
## ⚠️ Decisiones pendientes del MER
Este contrato asume tres ajustes que **no están** en el diccionario de datos actual. Hay que decidirlos en equipo (y avisar al profe si cambia el MER):
1. **`Proyecto.modelo_ia`** (VARCHAR 50): HU-02 y HU-03 hablan de un modelo "configurado en el proyecto", pero hoy solo existe `Analisis.modelo_ia_usado`.
2. **`Resultado.id_archivo`** (FK a Archivo): HU-07 pide agrupar hallazgos por archivo y hoy Resultado no sabe de qué archivo viene.
3. **Subcarpetas:** `SolicitudRevision` solo puede apuntar a un archivo o a "la carpeta" (el proyecto completo). Si se quiere analizar una subcarpeta, falta un campo (ej. `ruta_relativa`).
