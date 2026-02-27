ALTER TABLE ege_tasks ADD COLUMN parent_id VARCHAR(255);
ALTER TABLE ege_tasks ADD CONSTRAINT fk_ege_tasks_parent FOREIGN KEY (parent_id) REFERENCES ege_tasks(id) ON DELETE CASCADE;
CREATE INDEX idx_ege_tasks_parent_id ON ege_tasks(parent_id);