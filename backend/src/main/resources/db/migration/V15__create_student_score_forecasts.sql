CREATE TABLE IF NOT EXISTS student_score_forecasts (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    student_id UUID NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_score INTEGER NOT NULL,
    confidence_low INTEGER,
    confidence_high INTEGER,
    source VARCHAR(30) NOT NULL DEFAULT 'DASHBOARD',

    CONSTRAINT fk_score_forecast_student
        FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT uq_score_forecast_student_date UNIQUE(student_id, forecast_date)
);

CREATE INDEX IF NOT EXISTS idx_score_forecast_student
    ON student_score_forecasts(student_id);

CREATE INDEX IF NOT EXISTS idx_score_forecast_date
    ON student_score_forecasts(forecast_date);
