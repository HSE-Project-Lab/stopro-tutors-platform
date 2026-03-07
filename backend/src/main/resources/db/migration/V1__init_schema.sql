CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username      VARCHAR(100)  NOT NULL,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(20)   NOT NULL,          -- STUDENT | TEACHER | ADMIN
    full_name     VARCHAR(255)  NOT NULL,
    data_consent_status BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP,
    version       BIGINT        NOT NULL DEFAULT 0,
    is_deleted    BOOLEAN       NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT chk_users_role    CHECK (role IN ('STUDENT', 'TEACHER', 'ADMIN'))
);

CREATE UNIQUE INDEX idx_user_username ON users (username);
CREATE INDEX idx_user_role            ON users (role);

CREATE TABLE study_groups (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255) NOT NULL,
    teacher_id  UUID         NOT NULL,
    invite_code VARCHAR(10)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    version     BIGINT       NOT NULL DEFAULT 0,
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT uq_groups_invite_code UNIQUE (invite_code),
    CONSTRAINT fk_groups_teacher     FOREIGN KEY (teacher_id)
        REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_group_teacher     ON study_groups (teacher_id);
CREATE UNIQUE INDEX idx_group_invite_code ON study_groups (invite_code);

CREATE TABLE group_students (
    group_id   UUID NOT NULL,
    student_id UUID NOT NULL,

    PRIMARY KEY (group_id, student_id),

    CONSTRAINT fk_gs_group   FOREIGN KEY (group_id)
        REFERENCES study_groups (id) ON DELETE CASCADE,
    CONSTRAINT fk_gs_student FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_gs_group   ON group_students (group_id);
CREATE INDEX idx_gs_student ON group_students (student_id);

CREATE TABLE topics (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    parent_id  UUID,
    ege_number INTEGER,            -- Номер задания ЕГЭ (1–19)
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    version    BIGINT       NOT NULL DEFAULT 0,
    is_deleted BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_topics_parent FOREIGN KEY (parent_id)
        REFERENCES topics (id) ON DELETE SET NULL
);

CREATE INDEX idx_topic_parent     ON topics (parent_id);
CREATE INDEX idx_topic_ege_number ON topics (ege_number);

CREATE TABLE questions (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id       UUID         NOT NULL,
    ege_number     INTEGER      NOT NULL,
    difficulty     VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
    question_type  VARCHAR(30)  NOT NULL DEFAULT 'SHORT_ANSWER',
    content        TEXT         NOT NULL,         -- условие (с LaTeX)
    content_plain  TEXT,                          -- plain-text для поиска
    answer         VARCHAR(1000) NOT NULL,        -- правильный ответ
    solution       TEXT,                          -- пошаговое решение
    solution_latex TEXT,                          -- решение в LaTeX
    hints          TEXT,                          -- подсказки (JSON)
    points         INTEGER      NOT NULL DEFAULT 1,
    source         VARCHAR(30)  DEFAULT 'CUSTOM',
    source_year    INTEGER,
    source_variant INTEGER,
    author_id      UUID,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP,
    version        BIGINT       NOT NULL DEFAULT 0,
    is_deleted     BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_questions_topic  FOREIGN KEY (topic_id)
        REFERENCES topics (id) ON DELETE RESTRICT,
    CONSTRAINT fk_questions_author FOREIGN KEY (author_id)
        REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_question_topic      ON questions (topic_id);
CREATE INDEX idx_question_ege_number ON questions (ege_number);
CREATE INDEX idx_question_difficulty ON questions (difficulty);
CREATE INDEX idx_question_source     ON questions (source);
CREATE INDEX idx_question_type       ON questions (question_type);
CREATE INDEX idx_question_active     ON questions (is_active, is_deleted);
CREATE INDEX idx_question_author     ON questions (author_id);

CREATE TABLE assignments (
    id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title                    VARCHAR(255) NOT NULL,
    description              TEXT,
    instructions             TEXT,
    assignment_type          VARCHAR(30)  NOT NULL DEFAULT 'HOMEWORK',
    status                   VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    teacher_id               UUID         NOT NULL,
    created_by_id            UUID,
    group_id                 UUID         NOT NULL,

    start_date               TIMESTAMP,
    deadline                 TIMESTAMP    NOT NULL,
    soft_deadline            TIMESTAMP,
    late_penalty_percent     INTEGER      NOT NULL DEFAULT 0,
    time_limit_minutes       INTEGER,

    max_attempts             INTEGER      DEFAULT 1,
    use_best_attempt         BOOLEAN      NOT NULL DEFAULT TRUE,
    cooldown_minutes         INTEGER      NOT NULL DEFAULT 0,

    show_correct_answers     BOOLEAN      NOT NULL DEFAULT TRUE,
    show_answers_mode        VARCHAR(30)  DEFAULT 'AFTER_DEADLINE',
    show_solutions           BOOLEAN      NOT NULL DEFAULT TRUE,
    show_immediate_feedback  BOOLEAN      NOT NULL DEFAULT FALSE,
    shuffle_questions        BOOLEAN      NOT NULL DEFAULT FALSE,
    shuffle_answers          BOOLEAN      NOT NULL DEFAULT FALSE,

    passing_score_percent    INTEGER      DEFAULT 60,
    total_points             INTEGER      NOT NULL DEFAULT 0,
    weight                   DOUBLE PRECISION DEFAULT 1.0,

    send_deadline_reminder   BOOLEAN      NOT NULL DEFAULT TRUE,
    reminder_hours_before    INTEGER      DEFAULT 24,
    notify_teacher_on_complete BOOLEAN    NOT NULL DEFAULT FALSE,

    views_count              INTEGER      NOT NULL DEFAULT 0,
    started_count            INTEGER      NOT NULL DEFAULT 0,
    completed_count          INTEGER      NOT NULL DEFAULT 0,
    average_score            DOUBLE PRECISION,
    average_time_minutes     INTEGER,

    published_at             TIMESTAMP,
    archived_at              TIMESTAMP,
    template_id              UUID,
    is_template              BOOLEAN      NOT NULL DEFAULT FALSE,

    created_at               TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP,
    version                  BIGINT       NOT NULL DEFAULT 0,
    is_deleted               BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_assignments_teacher FOREIGN KEY (teacher_id)
        REFERENCES users (id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignments_group   FOREIGN KEY (group_id)
        REFERENCES study_groups (id) ON DELETE RESTRICT
);

CREATE INDEX idx_assignment_teacher  ON assignments (teacher_id);
CREATE INDEX idx_assignment_group    ON assignments (group_id);
CREATE INDEX idx_assignment_status   ON assignments (status);
CREATE INDEX idx_assignment_deadline ON assignments (deadline);
CREATE INDEX idx_assignment_type     ON assignments (assignment_type);
CREATE INDEX idx_assignment_dates    ON assignments (start_date, deadline);

CREATE TABLE assignment_questions (
    assignment_id  UUID    NOT NULL,
    question_id    UUID    NOT NULL,
    question_order INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (assignment_id, question_id),

    CONSTRAINT fk_aq_assignment FOREIGN KEY (assignment_id)
        REFERENCES assignments (id) ON DELETE CASCADE,
    CONSTRAINT fk_aq_question   FOREIGN KEY (question_id)
        REFERENCES questions (id) ON DELETE CASCADE
);

CREATE INDEX idx_aq_assignment ON assignment_questions (assignment_id);
CREATE INDEX idx_aq_question   ON assignment_questions (question_id);

CREATE TABLE attempts (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id        UUID         NOT NULL,
    assignment_id     UUID,
    question_id       UUID         NOT NULL,
    user_answer       TEXT,
    normalized_answer VARCHAR(1000),
    status            VARCHAR(20)  NOT NULL DEFAULT 'IN_PROGRESS',
    started_at        TIMESTAMP,
    finished_at       TIMESTAMP,
    time_spent_seconds INTEGER,
    is_correct        BOOLEAN,
    score             DOUBLE PRECISION,

    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP,
    version           BIGINT       NOT NULL DEFAULT 0,
    is_deleted        BOOLEAN      NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_attempts_student    FOREIGN KEY (student_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_assignment FOREIGN KEY (assignment_id)
        REFERENCES assignments (id) ON DELETE SET NULL,
    CONSTRAINT fk_attempts_question   FOREIGN KEY (question_id)
        REFERENCES questions (id) ON DELETE RESTRICT
);

CREATE INDEX idx_attempt_student            ON attempts (student_id);
CREATE INDEX idx_attempt_assignment         ON attempts (assignment_id);
CREATE INDEX idx_attempt_question           ON attempts (question_id);
CREATE INDEX idx_attempt_status             ON attempts (status);
CREATE INDEX idx_attempt_started            ON attempts (started_at);
CREATE INDEX idx_attempt_student_assignment ON attempts (student_id, assignment_id);
CREATE INDEX idx_attempt_student_question   ON attempts (student_id, question_id);
