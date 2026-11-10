# Diccionario de datos

Las 10 tablas del modelo entidad-relación (esquema vigente: `database/schema.sql`, versión 7). Los cambios posteriores al documento entregado
son `Proyecto.modelo_ia`, `Resultado.id_archivo`, el UNIQUE de `Archivo`, `Resultado.regla` (migración 001) y `ChecklistItem.motivo` (migración 002).

| Nombre de tabla | Campo | Tipo de dato | Longitud / Tamaño | Descripción | Restricciones y validaciones | Relaciones |
|---|---|---|---|---|---|---|
| Proyecto | id_proyecto | INT | Entero (11) | Identificador único autogenerado del proyecto local. | PK · AUTO_INCREMENT · NOT NULL | 1:N con Archivo, SolicitudRevision, Proyecto_Lenguaje |
| Proyecto | nombre | VARCHAR | 100 | Nombre asignado por el usuario al proyecto. | NOT NULL | Ninguna |
| Proyecto | ruta_carpeta | VARCHAR | 255 | Ruta absoluta de la carpeta en el computador del usuario. | NOT NULL · UNIQUE | Ninguna |
| Proyecto | modelo_ia | VARCHAR | 50 | Modelo de Ollama asignado al proyecto para sus análisis (ej. qwen2.5-coder). | NOT NULL · DEFAULT 'qwen2.5-coder' | Ninguna |
| Proyecto | fecha_registro | DATE | — | Fecha en que se registró el proyecto. | NOT NULL · DEFAULT CURRENT_DATE | Ninguna |
| Proyecto | fecha_actualizacion | DATE | — | Fecha de la última modificación de la configuración. | NULL permitido | Ninguna |
| Proyecto | id_estado | INT | Entero (11) | Estado actual del proyecto (FK a la tabla Estado). | FK · NOT NULL | N:1 con Estado.id_estado |
| Archivo | id_archivo | INT | Entero (11) | Identificador único del archivo escaneado. | PK · AUTO_INCREMENT · NOT NULL | 1:N con SolicitudRevision, Resultado |
| Archivo | id_proyecto | INT | Entero (11) | Proyecto local al que pertenece el archivo. | FK · NOT NULL · ON DELETE CASCADE | N:1 con Proyecto.id_proyecto |
| Archivo | nombre_archivo | VARCHAR | 255 | Nombre del archivo detectado durante el escaneo. | NOT NULL | Ninguna |
| Archivo | ruta_relativa | VARCHAR | 255 | Ruta relativa del archivo dentro del proyecto. | NOT NULL · UNIQUE junto con id_proyecto | Ninguna |
| Archivo | lenguaje | VARCHAR | 20 | Lenguaje detectado según la extensión del archivo. | NOT NULL · CHECK IN ('js','ts','py') | Ninguna (guarda el código; no es FK a Lenguaje.nombre) |
| Archivo | (id_proyecto, ruta_relativa) | — | — | Un mismo archivo no se registra dos veces en un proyecto. | UNIQUE | Ninguna |
| Lenguaje | id_lenguaje | INT | Entero (11) | Identificador único del lenguaje soportado. | PK · AUTO_INCREMENT · NOT NULL | 1:N con Proyecto_Lenguaje |
| Lenguaje | nombre | VARCHAR | 30 | Nombre del lenguaje del catálogo (ej. JavaScript, TypeScript, Python). | NOT NULL · UNIQUE | Ninguna |
| Proyecto_Lenguaje | id_proyecto | INT | Entero (11) | Proyecto local incluido en la relación N:M. | FK · NOT NULL · ON DELETE CASCADE | N:1 con Proyecto.id_proyecto |
| Proyecto_Lenguaje | id_lenguaje | INT | Entero (11) | Lenguaje habilitado para ese proyecto. | FK · NOT NULL | N:1 con Lenguaje.id_lenguaje |
| SolicitudRevision | id_solicitud | INT | Entero (11) | Identificador único de la solicitud de revisión. | PK · AUTO_INCREMENT · NOT NULL | 1:N con Analisis |
| SolicitudRevision | id_proyecto | INT | Entero (11) | Proyecto local sobre el que se solicita la revisión. | FK · NOT NULL · ON DELETE CASCADE | N:1 con Proyecto.id_proyecto |
| SolicitudRevision | tipo_objetivo | VARCHAR | 10 | Alcance de la solicitud. | NOT NULL · CHECK IN ('carpeta','archivo') | Ninguna |
| SolicitudRevision | id_archivo | INT | Entero (11) | Archivo puntual solicitado, cuando tipo_objetivo = 'archivo'. | FK · NULL permitido | N:1 con Archivo.id_archivo |
| SolicitudRevision | fecha_solicitud | DATE | — | Fecha en que se realizó la solicitud. | NOT NULL · DEFAULT CURRENT_DATE | Ninguna |
| Analisis | id_analisis | INT | Entero (11) | Identificador único de la ejecución del análisis. | PK · AUTO_INCREMENT · NOT NULL | 1:N con Resultado, Reporte |
| Analisis | id_solicitud | INT | Entero (11) | Solicitud de revisión que originó el análisis. | FK · NOT NULL · ON DELETE CASCADE | N:1 con SolicitudRevision.id_solicitud |
| Analisis | fecha_analisis | DATE | — | Fecha de ejecución del análisis. | NOT NULL · DEFAULT CURRENT_DATE | Ninguna |
| Analisis | modelo_ia_usado | VARCHAR | 50 | Modelo de Ollama utilizado en la ejecución (ej. qwen2.5-coder). | NOT NULL · DEFAULT 'qwen2.5-coder' | Ninguna |
| Analisis | id_estado | INT | Entero (11) | Estado del proceso de análisis (FK a la tabla Estado). | FK · NOT NULL | N:1 con Estado.id_estado |
| Resultado | id_resultado | INT | Entero (11) | Identificador único del hallazgo detectado. | PK · AUTO_INCREMENT · NOT NULL | 1:N con ChecklistItem |
| Resultado | id_analisis | INT | Entero (11) | Análisis del cual proviene el hallazgo. | FK · NOT NULL · ON DELETE CASCADE | N:1 con Analisis.id_analisis |
| Resultado | id_archivo | INT | Entero (11) | Archivo del proyecto en el que se detectó el hallazgo. | FK · NOT NULL · ON DELETE CASCADE | N:1 con Archivo.id_archivo |
| Resultado | tipo | VARCHAR | 20 | Categoría del hallazgo (ej. vulnerabilidad, mala práctica, refactorización). | NOT NULL | Ninguna |
| Resultado | descripcion | TEXT | Max (65,535 bytes) | Descripción o propuesta de mejora generada por la IA. | NOT NULL · No vacío | Ninguna |
| Resultado | severidad | VARCHAR | 15 | Nivel de severidad del hallazgo. | NOT NULL · CHECK IN ('baja','media','alta','critica') | Ninguna |
| Resultado | linea_codigo | INT | Entero (11) | Número de línea del código donde aplica el hallazgo. | NOT NULL · CHECK (linea_codigo >= 1) | Ninguna |
| Resultado | regla | VARCHAR | 40 | Id de la regla estática que detectó el hallazgo (base de las estadísticas de mejora continua). | NULL permitido (resultados anteriores) | Ninguna |
| ChecklistItem | id_checklist | INT | Entero (11) | Identificador único del elemento de checklist. | PK · AUTO_INCREMENT · NOT NULL | Ninguna (entidad hoja) |
| ChecklistItem | id_resultado | INT | Entero (11) | Hallazgo individual al que corresponde el elemento del checklist. | FK · NOT NULL · ON DELETE CASCADE | N:1 con Resultado.id_resultado |
| ChecklistItem | id_estado | INT | Entero (11) | Estado de la sugerencia dentro del checklist (FK a la tabla Estado). | FK · NOT NULL | N:1 con Estado.id_estado |
| ChecklistItem | fecha_marcado | DATE | — | Fecha en que el desarrollador marcó el estado. | NULL permitido | Ninguna |
| ChecklistItem | motivo | VARCHAR | 20 | Motivo del rechazo: falso_positivo, no_aplica o riesgo_aceptado. | NULL permitido · CHECK IN ('falso_positivo','no_aplica','riesgo_aceptado') | Ninguna |
| Reporte | id_reporte | INT | Entero (11) | Identificador único del reporte generado. | PK · AUTO_INCREMENT · NOT NULL | Ninguna (entidad hoja) |
| Reporte | id_analisis | INT | Entero (11) | Análisis a partir del cual se generó el reporte. | FK · NOT NULL · ON DELETE CASCADE | N:1 con Analisis.id_analisis |
| Reporte | fecha_generacion | DATE | — | Fecha de generación del reporte. | NOT NULL · DEFAULT CURRENT_DATE | Ninguna |
| Reporte | formato | VARCHAR | 10 | Formato de exportación del reporte. | NOT NULL · CHECK IN ('pdf','html','json') | Ninguna |
| Reporte | ruta_archivo | VARCHAR | 255 | Ruta local donde se guarda el archivo exportado. | NOT NULL | Ninguna |
| Estado | id_estado | INT | Entero (11) | Identificador único del estado normalizado. | PK · AUTO_INCREMENT · NOT NULL | 1:N con Proyecto, Analisis, ChecklistItem |
| Estado | nombre_estado | VARCHAR | 30 | Nombre descriptivo del estado (ej. activo, pendiente, aceptada). | NOT NULL | Ninguna |
| Estado | contexto_modulo | VARCHAR | 30 | Módulo al que aplica el estado (ej. proyecto, analisis, checklist). | NOT NULL | Ninguna |
