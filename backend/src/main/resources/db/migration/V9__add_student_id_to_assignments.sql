ALTER TABLE assignments ALTER COLUMN group_id DROP NOT NULL;

ALTER TABLE assignments ADD COLUMN student_id UUID;
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_assignment_student_id ON assignments(student_id);