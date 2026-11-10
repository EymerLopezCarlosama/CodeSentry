# Diferenciación frente a agentes de codificación (Claude Code / OpenCode)

CodeSentry no compite en capacidad de generación con agentes como Claude Code u OpenCode: es una categoría de producto distinta.

| Criterio | Claude Code / OpenCode | CodeSentry (Modo Local) |
| --- | --- | --- |
| Naturaleza | Agente de propósito general: escribe features, refactoriza, ejecuta comandos y realiza commits. | Herramienta de solo lectura: analiza y opina. Nunca modifica ni ejecuta código de forma autónoma. |
| Permisos sobre el código | Requiere permisos de escritura y ejecución para realizar su trabajo. | Nunca necesita permisos de escritura; cero riesgo de modificación accidental del repositorio local. |
| Cómo se activa | El usuario lo invoca activamente en la terminal/IDE con instrucciones directas. | Se ejecuta de forma estructurada sobre la carpeta local registrada mediante la interfaz. |
| Alcance de uso | Herramienta de poder para un desarrollador individual frente a su terminal/IDE (autoría activa). | Proceso pasivo y compartido de gobernanza de calidad sobre revisiones de código local. |
| Memoria e historial | Por sesión; el contexto e historial se pierden al cerrar la terminal. | Historial persistente en base de datos local: sugerencias aceptadas/rechazadas y dashboard. |
| Interfaz gráfica | Basado en CLI/Terminal. | Interfaz gráfica web completa que hace legibles los diagnósticos y métricas. |
| Determinismo | No determinista: el mismo pedido puede dar resultados distintos. | Detección por reglas: mismo código, mismo resultado. La IA solo redacta la explicación. |

**Posicionamiento:** Claude Code y OpenCode son herramientas de autoría activa e individual bajo instrucción directa en terminal. CodeSentry es una herramienta pasiva de gobernanza de calidad que observa el código en local, no modifica archivos directamente y mantiene un historial y dashboard persistente.
