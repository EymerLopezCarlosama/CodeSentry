# Diccionario de datos

<!-- Diccionario de datos completo de las 10 tablas del MER (el original está en el documento Word entregado). -->

## Cambios respecto al diccionario entregado (v3)

| Tabla | Campo | Tipo | Longitud | Descripción | Restricciones | Relación |
|---|---|---|---|---|---|---|
| Proyecto | modelo_ia | VARCHAR | 50 | Modelo de Ollama asignado al proyecto (HU-02, HU-03). | NOT NULL · DEFAULT 'qwen2.5-coder' | Ninguna |
| Resultado | id_archivo | INT | Entero (11) | Archivo donde se detectó el hallazgo (HU-07 agrupa por archivo). | FK · NOT NULL · ON DELETE CASCADE | N:1 con Archivo.id_archivo |
| Archivo | (id_proyecto, ruta_relativa) | — | — | Un mismo archivo no se registra dos veces en un proyecto. | UNIQUE | Ninguna |

Además, en la tabla Archivo cambia la relación de `lenguaje`: guarda el código ('js','ts','py') y no tiene FK a Lenguaje.nombre (que guarda 'JavaScript','TypeScript','Python'). El diccionario original la describía como "N:1 con Lenguaje.nombre"; no es una FK real.
