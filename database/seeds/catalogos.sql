USE codesentry;

INSERT INTO Lenguaje (nombre) VALUES ('JavaScript'), ('TypeScript'), ('Python');

INSERT INTO Estado (nombre_estado, contexto_modulo) VALUES
  ('activo',     'proyecto'),
  ('inactivo',   'proyecto'),
  ('pendiente',  'analisis'),
  ('en_proceso', 'analisis'),
  ('completado', 'analisis'),
  ('fallido',    'analisis'),
  ('pendiente',  'checklist'),
  ('aceptada',   'checklist'),
  ('rechazada',  'checklist');
