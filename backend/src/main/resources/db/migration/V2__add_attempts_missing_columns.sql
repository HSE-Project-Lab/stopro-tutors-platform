ALTER TABLE attempts
    ADD COLUMN IF NOT EXISTS partial_score       DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS points_earned      INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS max_points         INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS answered_at        TIMESTAMP,
    ADD COLUMN IF NOT EXISTS checked_at         TIMESTAMP,
    ADD COLUMN IF NOT EXISTS answers            TEXT,
    ADD COLUMN IF NOT EXISTS correct_count      INTEGER,
    ADD COLUMN IF NOT EXISTS total_questions    INTEGER,
    ADD COLUMN IF NOT EXISTS attempt_number     INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_interrupted     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS interruption_reason VARCHAR(255),
    ADD COLUMN IF NOT EXISTS solution_image_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS additional_images  TEXT,
    ADD COLUMN IF NOT EXISTS solution_text      TEXT,
    ADD COLUMN IF NOT EXISTS solution_pdf_url   VARCHAR(500),
    ADD COLUMN IF NOT EXISTS recognized_text    TEXT,
    ADD COLUMN IF NOT EXISTS ocr_confidence     DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS ai_analysis        TEXT,
    ADD COLUMN IF NOT EXISTS ai_feedback        TEXT,
    ADD COLUMN IF NOT EXISTS ai_error_type      VARCHAR(30),
    ADD COLUMN IF NOT EXISTS ai_recommendations TEXT,
    ADD COLUMN IF NOT EXISTS ai_quality_score   INTEGER,
    ADD COLUMN IF NOT EXISTS celery_task_id     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS ai_check_status    VARCHAR(20),
    ADD COLUMN IF NOT EXISTS is_manually_checked BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS checked_by_id      UUID,
    ADD COLUMN IF NOT EXISTS teacher_comment    TEXT,
    ADD COLUMN IF NOT EXISTS score_overridden   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS original_points    INTEGER,
    ADD COLUMN IF NOT EXISTS client_ip          VARCHAR(45),
    ADD COLUMN IF NOT EXISTS user_agent          VARCHAR(500),
    ADD COLUMN IF NOT EXISTS device_type        VARCHAR(20),
    ADD COLUMN IF NOT EXISTS session_id         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS tab_switches_count  INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS copy_paste_detected BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_suspicious      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS suspicious_reason VARCHAR(500),
    ADD COLUMN IF NOT EXISTS parent_attempt_id  UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_attempts_parent'
    ) THEN
        ALTER TABLE attempts
            ADD CONSTRAINT fk_attempts_parent
            FOREIGN KEY (parent_attempt_id) REFERENCES attempts (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_attempt_parent ON attempts (parent_attempt_id);
