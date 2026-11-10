# Historias de usuario

Historias HU-01 a HU-13 con prioridad, puntos y criterios de aceptación (SMART). HU-01 a HU-10 son el módulo firme; HU-11 y HU-12 son extensiones opcionales ya implementadas; HU-13 agrega la mejora continua.

## HU-01: Registrar proyecto local

**Usuario:** Desarrollador · **Prioridad en negocio:** Alta · **Riesgo en desarrollo:** Baja · **Puntos:** 3 · **Interacción:** Sprint 1

**Descripción:** Como Desarrollador, quiero registrar la ruta de una carpeta de código de mi equipo local en CodeSentry, para gestionar el proyecto de forma privada y poder ejecutar análisis de calidad localmente sin subir nada a internet.

**Criterios de aceptación:**

- **CA01.** El usuario puede ingresar o seleccionar una ruta del sistema de archivos local y el sistema valida que exista antes de guardar.
- **CA02.** Al guardar, el proyecto queda registrado en la tabla Proyecto (nombre, ruta_carpeta, modelo_ia por defecto "qwen2.5-coder", fecha_registro y estado activo) y aparece en el listado en máximo 2 segundos.
- **CA03.** Si la ruta no existe o ya está registrada (ruta_carpeta es UNIQUE), el sistema muestra un mensaje de advertencia claro y no crea ningún registro.
- **CA04.** Durante el registro no se realiza ninguna conexión a servicios externos (0 peticiones fuera de localhost).

## HU-02: Ver proyectos locales registrados

**Usuario:** Desarrollador · **Prioridad en negocio:** Alta · **Riesgo en desarrollo:** Baja · **Puntos:** 2 · **Interacción:** Sprint 1

**Descripción:** Como Desarrollador, quiero ver la lista de mis proyectos y carpetas locales registrados, para seleccionar sobre cuál deseo ejecutar un análisis o consultar sus resultados.

**Criterios de aceptación:**

- **CA01.** La lista despliega, por cada proyecto, el nombre, la ruta local, el modelo de Ollama configurado y la fecha de registro.
- **CA02.** El listado se carga desde la base de datos local en máximo 2 segundos con hasta 50 proyectos registrados.
- **CA03.** Si no existen carpetas registradas, se muestra una vista inicial limpia con la opción de agregar el primer proyecto local.
- **CA04.** Desde cada elemento de la lista el usuario puede acceder a las acciones de actualizar, eliminar y solicitar revisión.

## HU-03: Actualizar configuración de proyecto local

**Usuario:** Desarrollador · **Prioridad en negocio:** Media · **Riesgo en desarrollo:** Baja · **Puntos:** 3 · **Interacción:** Sprint 1

**Descripción:** Como Desarrollador, quiero actualizar la configuración de un proyecto local (modificar ruta, cambiar el modelo de Ollama asignado o ajustar filtros), para adaptar el análisis a las características del repositorio.

**Criterios de aceptación:**

- **CA01.** El usuario puede cambiar el modelo de Ollama a utilizar (ej. Qwen2.5-Coder, Llama3) o actualizar la ruta de la carpeta.
- **CA02.** Si la nueva ruta no existe o ya pertenece a otro proyecto, el sistema rechaza el cambio y muestra un mensaje de advertencia.
- **CA03.** Los cambios se guardan en la tabla Proyecto, se actualiza fecha_actualizacion y se aplican de inmediato para el siguiente escaneo local.
- **CA04.** Tras guardar, el listado de proyectos refleja los nuevos valores sin recargar manualmente la aplicación.

## HU-04: Eliminar proyecto local

**Usuario:** Desarrollador · **Prioridad en negocio:** Media · **Riesgo en desarrollo:** Baja · **Puntos:** 2 · **Interacción:** Sprint 1

**Descripción:** Como Desarrollador, quiero eliminar un proyecto local del sistema, para retirar registros que ya no necesite inspeccionar.

**Criterios de aceptación:**

- **CA01.** Antes de eliminar, el sistema solicita confirmación explícita del usuario; si cancela, no se modifica ningún dato.
- **CA02.** Al confirmar, el registro se elimina de la tabla Proyecto y, por ON DELETE CASCADE, también sus solicitudes de revisión asociadas.
- **CA03.** Los archivos físicos de la carpeta en el computador del usuario permanecen intactos (0 archivos borrados o modificados).
- **CA04.** El proyecto eliminado deja de aparecer en el listado inmediatamente después de confirmar.

## HU-05: Solicitud de revisión de proyecto

**Usuario:** Desarrollador · **Prioridad en negocio:** Alta · **Riesgo en desarrollo:** Baja · **Puntos:** 3 · **Interacción:** Sprint 2

**Descripción:** Como Desarrollador, quiero especificar la carpeta o archivo y el/los lenguaje(s) que deseo analizar antes de iniciar la revisión, para enfocar el análisis de IA únicamente en el alcance que me interesa.

**Criterios de aceptación:**

- **CA01.** El usuario puede seleccionar un proyecto local ya registrado y, dentro de él, la carpeta o el archivo específico a analizar.
- **CA02.** El sistema filtra y muestra únicamente los lenguajes soportados (.js, .ts, .py) detectados dentro de la selección; los demás se notifican como "lenguaje no soportado".
- **CA03.** Al confirmar, se crea un registro en SolicitudRevision (tipo_objetivo carpeta/archivo) y, a partir de ella, un registro en Analisis con estado "pendiente" que dispara el escaneo con IA.
- **CA04.** Si la selección no contiene ningún archivo con extensión soportada, el sistema impide iniciar la revisión y lo informa al usuario.

## HU-06: Análisis local de código (reglas estáticas y explicación con Ollama)

**Usuario:** Desarrollador · **Prioridad en negocio:** Alta · **Riesgo en desarrollo:** Media · **Puntos:** 8 · **Interacción:** Sprint 2

**Descripción:** Como Desarrollador, quiero ejecutar un análisis de los archivos de mi proyecto local (JavaScript, TypeScript, Python), para detectar fallos, malas prácticas y vulnerabilidades con resultados reproducibles, sin que mi código salga de la máquina.

**Criterios de aceptación:**

- **CA01.** Las reglas estáticas detectan y clasifican cada hallazgo (regla, tipo, severidad, línea ≥ 1) sin depender de Ollama; el mismo código produce los mismos hallazgos.
- **CA02.** Se analizan solo archivos .js, .jsx, .ts, .tsx y .py; se ignoran node_modules, .git, dist, build, __pycache__, .venv, tests, __tests__ y fixtures; el resto se notifica como "lenguaje no soportado".
- **CA03.** Si Ollama está disponible y el modelo instalado, la IA local redacta una explicación breve de los hallazgos más graves (tope configurable, 25 por defecto). Si no, se usa la descripción fija: el análisis nunca falla por la IA.
- **CA04.** Un indicador de progreso (archivos analizados y explicaciones) que no retrocede.
- **CA05.** Cada hallazgo se guarda en Resultado con regla, tipo, descripción, severidad y línea, y el Analisis pasa a "completado" (o a "fallido" si ningún archivo pudo leerse).
- **CA06.** Un comentario codesentry-ignore en la línea o en la anterior silencia ese hallazgo.
- **CA07.** 0 peticiones a hosts distintos de localhost.

## HU-07: Consultar resultados

**Usuario:** Desarrollador · **Prioridad en negocio:** Alta · **Riesgo en desarrollo:** Baja · **Puntos:** 3 · **Interacción:** Sprint 3

**Descripción:** Como Desarrollador, quiero consultar los resultados de un análisis ya ejecutado, para revisar los hallazgos y sugerencias generados por la IA local sobre mi código.

**Criterios de aceptación:**

- **CA01.** El sistema recupera y muestra los hallazgos almacenados en la tabla Resultado, vinculados al Análisis ejecutado, junto con el estado de su ChecklistItem asociado.
- **CA02.** Los hallazgos se agrupan por archivo y se ordenan por severidad, de crítica a baja.
- **CA03.** Si el análisis aún está en proceso, se muestra el estado correspondiente en lugar de una lista de resultados vacía.
- **CA04.** Cada hallazgo muestra el archivo, la línea de código, el tipo, la severidad y la descripción de la mejora propuesta.

## HU-08: Reporte de resultados

**Usuario:** Desarrollador · **Prioridad en negocio:** Media · **Riesgo en desarrollo:** Baja · **Puntos:** 3 · **Interacción:** Sprint 3

**Descripción:** Como Desarrollador, quiero generar un reporte consolidado de los resultados de un análisis, para tener un resumen legible y compartible del estado de calidad del proyecto.

**Criterios de aceptación:**

- **CA01.** El reporte incluye el total de hallazgos (tabla Resultado), su distribución por severidad y por archivo, y la fecha del análisis.
- **CA02.** Al generarse, se crea un registro en la tabla Reporte con el formato (pdf, html o json) y la ruta del archivo exportado.
- **CA03.** El usuario puede exportar o copiar el reporte generado, y el archivo se guarda en la ruta local indicada.
- **CA04.** El reporte de un análisis de hasta 100 hallazgos se genera en máximo 10 segundos.

## HU-09: Checklist de sugerencias

**Usuario:** Desarrollador · **Prioridad en negocio:** Media · **Riesgo en desarrollo:** Baja · **Puntos:** 3 · **Interacción:** Sprint 3

**Descripción:** Como Desarrollador, quiero marcar cada sugerencia de refactorización generada por la IA local como pendiente, aceptada o rechazada, para llevar un control de qué recomendaciones fueron aprobadas y cuáles descartadas.

**Criterios de aceptación:**

- **CA01.** Cada elemento del checklist incluye el código afectado, la recomendación y las opciones "Aceptar" / "Rechazar".
- **CA02.** Todo elemento nuevo se crea con estado "pendiente"; al marcarlo, el estado se actualiza en ChecklistItem mediante la relación con la tabla Estado (pendiente / aceptada / rechazada) y se registra fecha_marcado.
- **CA03.** El cambio de estado se refleja en pantalla de forma inmediata, sin recargar la vista.
- **CA04.** El usuario puede reabrir una sugerencia aceptada o rechazada devolviéndola a "pendiente".
- **CA05.** Al rechazar una sugerencia el desarrollador indica el motivo (falso positivo, no aplica o riesgo aceptado); se guarda en ChecklistItem.motivo y se borra al aceptar o volver a pendiente.

## HU-10: Ver dashboard general

**Usuario:** Desarrollador · **Prioridad en negocio:** Media · **Riesgo en desarrollo:** Baja · **Puntos:** 3 · **Interacción:** Sprint 4

**Descripción:** Como Desarrollador, quiero consultar un dashboard general con el estado de mis proyectos, resultados y progreso del checklist de sugerencias, para tener una visión consolidada de la calidad de mi trabajo.

**Criterios de aceptación:**

- **CA01.** Muestra estadísticas consolidadas de sugerencias aceptadas vs. rechazadas y niveles de severidad por proyecto.
- **CA02.** Se actualiza automáticamente al finalizar cada escaneo local, sin intervención manual del usuario.
- **CA03.** Presenta en un solo panel el estado de los proyectos registrados, los resultados del último análisis y el progreso del checklist (% de sugerencias resueltas).
- **CA04.** El dashboard carga en máximo 3 segundos con hasta 50 proyectos registrados.
- **CA05.** El dashboard muestra la tabla "Calidad de las reglas" con aceptación y precisión estimada por regla; con menos de 10 hallazgos marcados no se saca ninguna conclusión.

## HU-11: Generar documentación técnica (extensión opcional, implementada)

**Usuario:** Desarrollador · **Prioridad en negocio:** Baja · **Riesgo en desarrollo:** Baja · **Puntos:** 5 · **Interacción:** Sprint 4

**Descripción:** Como Desarrollador, quiero solicitar a la IA local la generación de documentación o comentarios para un archivo de código, para mejorar la legibilidad y mantener actualizado el proyecto de forma automática.

**Criterios de aceptación:**

- **CA01.** La acción se ejecuta desde la vista de resultados, en cada archivo analizado (.js, .ts o .py).
- **CA02.** Muestra un documento Markdown con un resumen y los docstrings (Python) o JSDoc (JS y TS) propuestos para cada función o clase, con opciones de copiar al portapapeles y descargar.
- **CA03.** El sistema no modifica el archivo original del usuario ni escribe en su proyecto; la documentación solo se muestra para copiar o descargar.
- **CA04.** Los archivos de más de 300 líneas se recortan y se avisa; si el modelo no devuelve un documento válido tras 2 intentos se informa el error.

## HU-12: Generar casos de prueba (extensión opcional, implementada)

**Usuario:** Desarrollador · **Prioridad en negocio:** Alta (entre las opcionales) · **Riesgo en desarrollo:** Baja · **Puntos:** 5 · **Interacción:** Sprint 4

**Descripción:** Como Desarrollador, quiero solicitar la generación de pruebas unitarias para un archivo o función específica, para incrementar la cobertura de pruebas de mi proyecto local.

**Criterios de aceptación:**

- **CA01.** El usuario genera las pruebas desde el archivo, en la vista de resultados.
- **CA02.** El sistema retorna el código del test en el framework correspondiente (Jest para JavaScript y TypeScript, PyTest para Python), listo para copiar o descargar con un nombre sugerido.
- **CA03.** El sistema no escribe ni ejecuta el código generado en el proyecto del usuario.
- **CA04.** Los archivos de más de 300 líneas se recortan y se avisa; si el modelo no devuelve pruebas válidas tras 2 intentos se informa el error.

## HU-13: Mejorar la calidad del análisis con el checklist

**Usuario:** Desarrollador · **Prioridad en negocio:** Media · **Riesgo en desarrollo:** Baja · **Puntos:** 5 · **Interacción:** Sprint 4

**Descripción:** Como Desarrollador, quiero que CodeSentry use mis decisiones del checklist para medir qué reglas aciertan y para que las explicaciones de la IA sigan el estilo que aprobé, para que la calidad del análisis mejore con el tiempo.

**Criterios de aceptación:**

- **CA01.** Por cada regla se muestra cuántos hallazgos se aceptaron, rechazaron y marcaron como falso positivo, con la tasa de aceptación y la precisión estimada.
- **CA02.** Solo el rechazo con motivo "falso positivo" reduce la precisión; "no aplica" y "riesgo aceptado" no.
- **CA03.** Con menos de 10 hallazgos marcados por regla no se emite sugerencia. El sistema solo sugiere: nunca desactiva ni modifica una regla por su cuenta.
- **CA04.** Al explicar un hallazgo, el prompt incluye hasta 2 explicaciones anteriores aceptadas de la misma regla (nunca la descripción fija). Sin ejemplos, o si no se pueden leer, el análisis sigue igual que siempre.
- **CA05.** Los ejemplos y las estadísticas permanecen en el equipo del usuario (0 peticiones fuera de localhost).
