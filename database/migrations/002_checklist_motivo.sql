USE codesentry;

-- Motivo del rechazo; solo tiene sentido cuando el estado es 'rechazada'.
ALTER TABLE ChecklistItem ADD COLUMN motivo VARCHAR(20) NULL AFTER id_estado;
ALTER TABLE ChecklistItem ADD CONSTRAINT chk_checklist_motivo
  CHECK (motivo IS NULL OR motivo IN ('falso_positivo','no_aplica','riesgo_aceptado'));