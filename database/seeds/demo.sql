-- Datos de DEMOSTRACIÓN para el dashboard (no son datos reales).
-- Se cargan a mano; docker-compose solo ejecuta schema.sql y catalogos.sql.
-- Se puede volver a ejecutar: primero borra los proyectos demo (ruta D:/demo/...).
USE codesentry;

DELETE FROM Proyecto WHERE ruta_carpeta LIKE 'D:/demo/%';

-- Proyectos
INSERT INTO Proyecto (nombre, ruta_carpeta, id_estado)
VALUES ('Demo API Tienda', 'D:/demo/api-tienda',
        (SELECT id_estado FROM Estado WHERE nombre_estado = 'activo' AND contexto_modulo = 'proyecto'));
SET @p1 = LAST_INSERT_ID();

INSERT INTO Proyecto (nombre, ruta_carpeta, id_estado)
VALUES ('Demo Scripts Python', 'D:/demo/scripts-python',
        (SELECT id_estado FROM Estado WHERE nombre_estado = 'activo' AND contexto_modulo = 'proyecto'));
SET @p2 = LAST_INSERT_ID();

INSERT INTO Proyecto (nombre, ruta_carpeta, id_estado)
VALUES ('Demo Sin Analizar', 'D:/demo/sin-analizar',
        (SELECT id_estado FROM Estado WHERE nombre_estado = 'activo' AND contexto_modulo = 'proyecto'));
SET @p3 = LAST_INSERT_ID();

-- Lenguajes habilitados por proyecto
INSERT INTO Proyecto_Lenguaje (id_proyecto, id_lenguaje)
SELECT @p1, id_lenguaje FROM Lenguaje WHERE nombre IN ('JavaScript', 'TypeScript');
INSERT INTO Proyecto_Lenguaje (id_proyecto, id_lenguaje)
SELECT @p2, id_lenguaje FROM Lenguaje WHERE nombre = 'Python';
INSERT INTO Proyecto_Lenguaje (id_proyecto, id_lenguaje)
SELECT @p3, id_lenguaje FROM Lenguaje WHERE nombre = 'JavaScript';

-- Archivos
INSERT INTO Archivo (id_proyecto, nombre_archivo, ruta_relativa, lenguaje) VALUES
  (@p1, 'app.ts',   'src/app.ts', 'ts'),
  (@p1, 'db.js',    'src/db.js',  'js'),
  (@p2, 'main.py',  'main.py',    'py'),
  (@p2, 'utils.py', 'utils.py',   'py'),
  (@p3, 'index.js', 'index.js',   'js');

-- Un análisis completado para los proyectos 1 y 2 (el 3 queda sin analizar)
INSERT INTO SolicitudRevision (id_proyecto, tipo_objetivo) VALUES (@p1, 'carpeta');
SET @s1 = LAST_INSERT_ID();
INSERT INTO Analisis (id_solicitud, modelo_ia_usado, id_estado)
VALUES (@s1, 'qwen2.5-coder',
        (SELECT id_estado FROM Estado WHERE nombre_estado = 'completado' AND contexto_modulo = 'analisis'));
SET @n1 = LAST_INSERT_ID();

INSERT INTO SolicitudRevision (id_proyecto, tipo_objetivo) VALUES (@p2, 'carpeta');
SET @s2 = LAST_INSERT_ID();
INSERT INTO Analisis (id_solicitud, modelo_ia_usado, id_estado)
VALUES (@s2, 'qwen2.5-coder',
        (SELECT id_estado FROM Estado WHERE nombre_estado = 'completado' AND contexto_modulo = 'analisis'));
SET @n2 = LAST_INSERT_ID();

-- Hallazgos y estado de su checklist, en una sola lista (tabla temporal)
CREATE TEMPORARY TABLE demo_hallazgos (
  proyecto    TINYINT      NOT NULL,
  ruta        VARCHAR(255) NOT NULL,
  tipo        VARCHAR(20)  NOT NULL,
  severidad   VARCHAR(15)  NOT NULL,
  linea       INT          NOT NULL,
  descripcion TEXT         NOT NULL,
  estado      VARCHAR(30)  NOT NULL
);

INSERT INTO demo_hallazgos (proyecto, ruta, tipo, severidad, linea, descripcion, estado) VALUES
  (1, 'src/app.ts',  'vulnerabilidad',  'critica', 42, 'Consulta SQL concatenada con datos del usuario; usar parámetros (?).', 'pendiente'),
  (1, 'src/app.ts',  'vulnerabilidad',  'alta',    17, 'El secreto de la sesión está escrito en el código; moverlo a una variable de entorno.', 'aceptada'),
  (1, 'src/app.ts',  'mala_practica',   'media',   88, 'Los errores se ignoran en un catch vacío; registrar o propagar el error.', 'aceptada'),
  (1, 'src/db.js',   'mala_practica',   'media',   12, 'Se abre una conexión nueva por cada consulta; reutilizar un pool.', 'rechazada'),
  (1, 'src/db.js',   'refactorizacion', 'baja',    55, 'La función repite la misma validación tres veces; extraerla a una función.', 'pendiente'),
  (1, 'src/db.js',   'refactorizacion', 'baja',    73, 'Nombres de variables poco claros (a, b, tmp); usar nombres descriptivos.', 'aceptada'),
  (2, 'main.py',     'vulnerabilidad',  'alta',    23, 'Se usa eval() sobre texto de entrada; reemplazar por ast.literal_eval.', 'pendiente'),
  (2, 'main.py',     'mala_practica',   'media',    9, 'Importaciones con asterisco; importar solo lo necesario.', 'rechazada'),
  (2, 'utils.py',    'refactorizacion', 'baja',    31, 'Función de más de 60 líneas; dividirla en funciones más pequeñas.', 'pendiente'),
  (2, 'utils.py',    'mala_practica',   'critica', 14, 'La contraseña se compara en texto plano; usar un hash.', 'aceptada');

INSERT INTO Resultado (id_analisis, id_archivo, tipo, descripcion, severidad, linea_codigo)
SELECT IF(h.proyecto = 1, @n1, @n2), a.id_archivo, h.tipo, h.descripcion, h.severidad, h.linea
FROM demo_hallazgos h
JOIN Archivo a ON a.id_proyecto = IF(h.proyecto = 1, @p1, @p2) AND a.ruta_relativa = h.ruta;

INSERT INTO ChecklistItem (id_resultado, id_estado, fecha_marcado)
SELECT r.id_resultado, e.id_estado, IF(h.estado = 'pendiente', NULL, CURDATE())
FROM demo_hallazgos h
JOIN Archivo a   ON a.id_proyecto = IF(h.proyecto = 1, @p1, @p2) AND a.ruta_relativa = h.ruta
JOIN Resultado r ON r.id_archivo = a.id_archivo AND r.linea_codigo = h.linea
JOIN Estado e    ON e.nombre_estado = h.estado AND e.contexto_modulo = 'checklist';

DROP TEMPORARY TABLE demo_hallazgos;