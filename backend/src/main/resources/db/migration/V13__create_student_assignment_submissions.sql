CREATE TABLE IF NOT EXISTS student_assignment_submissions (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    submitted_at TIMESTAMP NOT NULL,

    total_questions INTEGER NOT NULL DEFAULT 0,
    answered_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    score_percent INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT fk_submission_assignment
        FOREIGN KEY (assignment_id) REFERENCES assignments(id),
    CONSTRAINT fk_submission_student
        FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_submission_student
    ON student_assignment_submissions(student_id);

CREATE INDEX IF NOT EXISTS idx_submission_assignment
    ON student_assignment_submissions(assignment_id);

CREATE INDEX IF NOT EXISTS idx_submission_submitted
    ON student_assignment_submissions(submitted_at);


CREATE TABLE IF NOT EXISTS student_assignment_answer_results (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    submission_id UUID NOT NULL,
    question_ref_id VARCHAR(100) NOT NULL,
    question_index INTEGER NOT NULL,
    ege_number INTEGER,
    topic_name VARCHAR(255),
    content TEXT,
    user_answer TEXT,
    is_correct BOOLEAN NOT NULL,
    correct_answer TEXT,
    solution TEXT,

    CONSTRAINT fk_answer_result_submission
        FOREIGN KEY (submission_id) REFERENCES student_assignment_submissions(id)
);

CREATE INDEX IF NOT EXISTS idx_answer_result_submission
    ON student_assignment_answer_results(submission_id);

CREATE INDEX IF NOT EXISTS idx_answer_result_correct
    ON student_assignment_answer_results(is_correct);
