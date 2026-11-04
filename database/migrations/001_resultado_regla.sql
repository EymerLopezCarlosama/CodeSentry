USE codesentry;

-- Id de la regla del analyzer que produjo el hallazgo (ej. 'sql-inyeccion').
-- NULL en los resultados anteriores a este cambio y en los datos demo.
ALTER TABLE Resultado ADD COLUMN regla VARCHAR(40) NULL AFTER id_archivo;
CREATE INDEX idx_resultado_regla ON Resultado (regla);