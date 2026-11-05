# Catálogo de reglas

| Regla | Tipo | Severidad | CWE | ISO/IEC 25010 | Descripción |
|---|---|---|---|---|---|
| eval | vulnerabilidad | critica | CWE-95 | Seguridad | Ejecución dinámica de código (eval/exec/Function): permite ejecutar código arbitrario si recibe datos externos. Evítela; use JSON.parse, ast.literal_eval o una lista de operaciones permitidas. |
| cmd-shell | vulnerabilidad | critica | CWE-78 | Seguridad | Se ejecuta un comando con shell=True: una entrada externa puede inyectar comandos. Pase los argumentos como lista y use shell=False. |
| secreto | vulnerabilidad | critica | CWE-798 | Seguridad | Credencial o clave escrita directamente en el código. Muévala a una variable de entorno o a un gestor de secretos y rótela. |
| conexion-credenciales | vulnerabilidad | critica | CWE-798 | Seguridad | Usuario y contraseña de una base de datos escritos en el código (cadena o parámetros de conexión). Cualquiera con acceso al repositorio puede usarlos. Léalos de variables de entorno, no los suba a git y rote la contraseña. |
| conexion-sin-password | vulnerabilidad | alta | CWE-259 | Seguridad | La conexión a la base de datos usa una contraseña vacía: cualquiera que alcance el servidor puede entrar. Asigne una contraseña y léala de una variable de entorno. |
| multiples-sentencias | vulnerabilidad | media | CWE-89 | Seguridad | multipleStatements permite ejecutar varias sentencias SQL en una sola consulta: si existe una inyección, el atacante puede encadenar DROP o UPDATE. Desactívelo y use consultas parametrizadas. |
| conexion-sin-cifrar | vulnerabilidad | media | CWE-319 | Seguridad | La conexión a la base de datos se configura sin cifrado TLS (ssl desactivado): credenciales y datos viajan en texto plano. Actívelo, sobre todo si la base no está en este mismo equipo. |
| sql-inyeccion | vulnerabilidad | alta | CWE-89 | Seguridad | Consulta SQL armada concatenando o interpolando valores: permite inyección SQL. Use consultas parametrizadas. |
| ruta-concatenada | vulnerabilidad | alta | CWE-22 | Seguridad | La ruta de un archivo se arma concatenando un valor externo: riesgo de path traversal. Valide la entrada y resuelva la ruta dentro de una carpeta permitida. |
| prototipos | vulnerabilidad | alta | CWE-1321 | Seguridad | Se copian propiedades con for...in sin filtrar __proto__ ni constructor: riesgo de contaminación de prototipos. Ignore esas claves o use Object.hasOwn. |
| deserializacion | vulnerabilidad | alta | CWE-502 | Seguridad | Deserialización insegura (pickle/marshal/yaml.load): ejecuta código si el dato viene de fuera. Use JSON o yaml.safe_load. |
| bucle-infinito | mala_practica | alta | CWE-835 | Fiabilidad | El bucle no modifica la variable de su condición ni tiene salida: no termina y bloquea el proceso. Actualice la variable dentro del bucle. |
| tls-desactivado | vulnerabilidad | media | CWE-295 | Seguridad | Se desactiva la verificación del certificado TLS: expone a ataques de intermediario. Déjela activa. |
| hash-debil | vulnerabilidad | media | CWE-327 | Seguridad | Algoritmo de hash débil (MD5/SHA-1). Use SHA-256 o superior; para contraseñas, bcrypt o argon2. |
| off-by-one | mala_practica | media | CWE-193 | Fiabilidad | El bucle usa <= contra .length: la última iteración accede fuera del arreglo. Use <. |
| null-find | mala_practica | media | CWE-476 | Fiabilidad | El resultado de .find() puede ser undefined y se usa sin comprobarlo: fallará en ejecución. Compruebe el valor o use ?. |
| default-mutable | mala_practica | media | — | Fiabilidad | Argumento por defecto mutable: se comparte entre llamadas. Use None y cree la lista dentro de la función. |
| open-sin-with | mala_practica | media | CWE-772 | Fiabilidad | El archivo se abre sin with: puede quedar abierto si ocurre un error. Use with open(...) as f. |
| variable-no-definida | mala_practica | media | CWE-457 | Fiabilidad | Una variable solo se asigna en algunas ramas y se usa después: si no se cumple esa condición, falla por variable sin definir. Inicialícela antes de la condición. |
| igualdad-laxa | mala_practica | baja | CWE-1025 | Mantenibilidad | Comparación con == / != aplica coerción de tipos. Use === / !==. |
| octal | mala_practica | baja | — | Mantenibilidad | Número con cero a la izquierda: JavaScript lo interpreta como octal. Quite el cero (o use 0o). |
| division-longitud | mala_practica | baja | CWE-369 | Fiabilidad | Se divide entre .length sin comprobar que no sea 0 (da NaN o Infinity). Compruebe que el arreglo no esté vacío. |
| any | refactorizacion | baja | — | Mantenibilidad | El tipo any desactiva la comprobación de tipos. Defina una interfaz o use unknown con validación. |
