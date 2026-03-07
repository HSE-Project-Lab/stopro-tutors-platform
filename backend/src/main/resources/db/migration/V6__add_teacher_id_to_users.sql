ALTER TABLE users
    ADD COLUMN IF NOT EXISTS teacher_id UUID;

ALTER TABLE users
    ADD CONSTRAINT fk_users_teacher
    FOREIGN KEY (teacher_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_teacher ON users (teacher_id);
