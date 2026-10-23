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

**POST /proyectos/escanear** body `{ "ruta_carpeta": "D:\\Proyectos\\mi-api" }` → `200`
```json
{ "soportados": { "JavaScript": 42, "Python": 7 },
  "no_soportados": { "Java": 12, "PHP": 3 },
  "total_archivos": 190, "truncado": false }
```
Se llama antes de registrar el proyecto (no guarda nada). Solo lectura. `truncado: true` si la carpeta es enorme y el conteo es parcial. Errores: `400 RUTA_INEXISTENTE` · `400 DATOS_INVALIDOS` · `502` analyzer caído.

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
Errores: `404 PROYECTO_NO_ENCONTRADO` · `400 RUTA_INEXISTENTE` (la carpeta ya no existe). Cada llamada re-escanea la carpeta; los `id_archivo` se conservan.

## Revisiones (HU-05)
**POST `/revisiones`** body:
```json
{ "id_proyecto": 1, "tipo_objetivo": "carpeta" }
{ "id_proyecto": 1, "tipo_objetivo": "archivo", "id_archivo": 10 }
```
→ `202`: `{ "id_solicitud": 5, "id_analisis": 7, "estado": "pendiente" }`
Crea la SolicitudRevision y un Analisis en estado `pendiente`, y dispara el escaneo en segundo plano.
Errores: `400 DATOS_INVALIDOS` (cuerpo mal formado, o `id_archivo` ausente/sobrante según el tipo) · `404 PROYECTO_NO_ENCONTRADO` · `400 ARCHIVO_INVALIDO` (el archivo no pertenece al proyecto o ya no existe) · `400 RUTA_INEXISTENTE` (la carpeta del proyecto ya no existe) · `400 SIN_ARCHIVOS_SOPORTADOS` (no hay `.js`, `.ts` ni `.py` para revisar).

## Análisis (HU-06)
**GET `/analisis/:id`** →
```json
{ "id_analisis": 7, "estado": "en_proceso", "modelo_ia_usado": "qwen2.5-coder",
  "fecha_analisis": "2026-10-04", "progreso": { "procesados": 3, "total": 12 } }
```
`estado`: `pendiente` · `en_proceso` · `completado` · `fallido`. El frontend consulta cada 2 s mientras no sea `completado`/`fallido`.
`progreso` no se guarda en BD: el backend lo mantiene en memoria mientras corre el análisis.

**GET `/analisis?proyecto=1&limite=5`** (ambos filtros opcionales) →
```json
[ { "id_analisis": 7, "id_proyecto": 1, "proyecto": "Mi API", "tipo_objetivo": "carpeta",
    "ruta_relativa": null, "fecha_analisis": "2026-10-04", "modelo_ia_usado": "qwen2.5-coder",
    "estado": "completado", "hallazgos": 12, "graves": 3 } ]
```
Historial ordenado del más reciente al más antiguo. `graves` = hallazgos de severidad alta + crítica. `limite`: 1–100. Errores: `400 DATOS_INVALIDOS` (proyecto o límite no numéricos).

## Resultados (HU-07)
**GET `/analisis/:id/resultados?severidad=alta`** (filtro opcional) →
```json
{ "estado": "completado",
  "archivos": [ { "ruta_relativa": "src/app.ts",
    "hallazgos": [ { "id_resultado": 31, "tipo": "vulnerabilidad", "severidad": "alta",
      "linea_codigo": 42, "descripcion": "...", "estado_checklist": "pendiente" } ] } ] }
```
Hallazgos ordenados por severidad (critica → baja). Si el análisis no terminó: `archivos: []` y el `estado` real, no un error.
Errores: `404 ANALISIS_NO_ENCONTRADO` · `400 DATOS_INVALIDOS` (id no numérico, o `severidad` fuera de baja/media/alta/critica).

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

## Sistema (selector de carpeta)
| GET | /sistema/seleccionar-carpeta | Abre el diálogo nativo del sistema operativo para elegir una carpeta |
|---|---|---|
→ `200` `{ "ruta": "D:\\Proyectos\\mi-api" }` · `204` si el usuario cancela · `501 SELECTOR_NO_DISPONIBLE` (sistema sin soporte) · `500 SELECTOR_ERROR` (no se pudo abrir el diálogo).
La petición queda abierta mientras el diálogo esté visible (máximo 5 minutos). Solo funciona porque backend y navegador corren en el mismo equipo.

## Utilidades
| GET | `/salud` | `{ "backend": "ok", "base_datos": "ok", "analyzer": "ok", "ollama": "ok" }` |
|---|---|---|
| GET | `/modelos` | `{ "instalados": [...], "permitidos": [...] }` (selector de HU-03) |
| POST | `/modelos/instalar` | body `{ "modelo" }` → `202` / `200` (ya instalado), mismo cuerpo que el analyzer |
| GET | `/modelos/instalar?modelo=...` | Estado de la descarga: `descargando` · `completado` · `fallido` |

## Extensiones opcionales
| POST | `/archivos/:id/documentacion` | HU-11 → `{ "contenido": "..." }` |
|---|---|---|
| POST | `/archivos/:id/pruebas` | HU-12 → `{ "framework": "jest", "contenido": "..." }` |

---
## Cambios al MER (v3)
Este contrato asume ajustes sobre el diccionario de datos entregado. Ya están aplicados en `database/schema.sql` y en `CodeSentry_MER_v3.drawio`; falta reflejarlos en el documento Word y avisar al profe:
1. **`Proyecto.modelo_ia`** (VARCHAR 50, NOT NULL, DEFAULT 'qwen2.5-coder') — ✅ aplicado. HU-02 y HU-03 hablan de un modelo configurado por proyecto.
2. **`Resultado.id_archivo`** (INT, NOT NULL, FK a Archivo, ON DELETE CASCADE) — ✅ aplicado. HU-07 agrupa hallazgos por archivo.
3. **`Archivo`: UNIQUE (id_proyecto, ruta_relativa)** — ✅ aplicado. Permite re-escanear un proyecto sin duplicar archivos ni perder resultados.

## ⚠️ Decisión pendiente
**Subcarpetas:** `SolicitudRevision` solo puede apuntar a un archivo o a "la carpeta" (el proyecto completo). Para el MVP se queda así. Si se quiere analizar una subcarpeta, falta un campo (ej. `ruta_relativa`) en `SolicitudRevision` y el contrato del analyzer ya lo soporta.