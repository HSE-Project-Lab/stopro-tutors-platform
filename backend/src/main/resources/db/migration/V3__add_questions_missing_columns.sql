ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS alternative_answers   TEXT,
    ADD COLUMN IF NOT EXISTS step_by_step_solution TEXT,
    ADD COLUMN IF NOT EXISTS hint                  TEXT,
    ADD COLUMN IF NOT EXISTS common_mistakes       TEXT,
    ADD COLUMN IF NOT EXISTS image_url             VARCHAR(500),
    ADD COLUMN IF NOT EXISTS additional_images     TEXT,
    ADD COLUMN IF NOT EXISTS diagram_svg          TEXT,
    ADD COLUMN IF NOT EXISTS geogebra_id           VARCHAR(100),
    ADD COLUMN IF NOT EXISTS estimated_time_minutes INTEGER DEFAULT 5,
    ADD COLUMN IF NOT EXISTS source_url            VARCHAR(500),
    ADD COLUMN IF NOT EXISTS is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verified_by_id        UUID,
    ADD COLUMN IF NOT EXISTS verified_at           TIMESTAMP,
    ADD COLUMN IF NOT EXISTS times_shown           INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS times_attempted       INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS times_correct         INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS average_time_seconds  INTEGER,
    ADD COLUMN IF NOT EXISTS average_attempts      DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS tags                  TEXT,
    ADD COLUMN IF NOT EXISTS keywords              TEXT,
    ADD COLUMN IF NOT EXISTS prerequisites         TEXT,
    ADD COLUMN IF NOT EXISTS question_version      INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS parent_question_id    UUID,
    ADD COLUMN IF NOT EXISTS is_latest_version     BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS is_premium            BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS review_notes          TEXT;

ALTER TABLE questions ALTER COLUMN source TYPE VARCHAR(50);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_parent'
    ) THEN
        ALTER TABLE questions
            ADD CONSTRAINT fk_questions_parent
            FOREIGN KEY (parent_question_id) REFERENCES questions (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_question_parent ON questions (parent_question_id);
