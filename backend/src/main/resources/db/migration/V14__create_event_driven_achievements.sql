CREATE TABLE IF NOT EXISTS achievement_definitions (
    achievement_key VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    rule_config TEXT,
    target_value INTEGER,
    icon_url VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_achievement_events (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    student_id UUID NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    event_date DATE NOT NULL,
    event_at TIMESTAMP NOT NULL,
    reference_id VARCHAR(120),
    payload TEXT,

    CONSTRAINT fk_achievement_event_student
        FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_event_student
    ON student_achievement_events(student_id);

CREATE INDEX IF NOT EXISTS idx_achievement_event_type
    ON student_achievement_events(event_type);

CREATE INDEX IF NOT EXISTS idx_achievement_event_date
    ON student_achievement_events(event_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_achievement_event_daily_student
    ON student_achievement_events(student_id, event_type, event_date)
    WHERE event_type = 'DAILY_CHALLENGE_COMPLETED';

CREATE TABLE IF NOT EXISTS student_achievement_progress (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    student_id UUID NOT NULL,
    achievement_key VARCHAR(100) NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    target_value INTEGER,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_event_at TIMESTAMP,
    unlocked_at TIMESTAMP,

    CONSTRAINT fk_achievement_progress_student
        FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_achievement_progress_definition
        FOREIGN KEY (achievement_key) REFERENCES achievement_definitions(achievement_key),
    CONSTRAINT uq_achievement_progress_student_key UNIQUE(student_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_student
    ON student_achievement_progress(student_id);

CREATE TABLE IF NOT EXISTS student_achievements (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    version BIGINT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    student_id UUID NOT NULL,
    achievement_key VARCHAR(100) NOT NULL,
    unlocked_at TIMESTAMP NOT NULL,

    CONSTRAINT fk_student_achievement_student
        FOREIGN KEY (student_id) REFERENCES users(id),
    CONSTRAINT fk_student_achievement_definition
        FOREIGN KEY (achievement_key) REFERENCES achievement_definitions(achievement_key),
    CONSTRAINT uq_student_achievement UNIQUE(student_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_student_achievement_student
    ON student_achievements(student_id);

INSERT INTO achievement_definitions (
    achievement_key, title, description, category, rule_type, rule_config, target_value, icon_url, sort_order
) VALUES
    ('IRON_STREAK_7', 'Железный стрик I', 'Решать минимум 1 задачу 7 дней подряд', 'DISCIPLINE', 'STREAK', '{"days":7,"minSolved":1}', 7, '/achievements/iron_streak_7.svg', 10),
    ('IRON_STREAK_30', 'Железный стрик II', 'Решать минимум 1 задачу 30 дней подряд', 'DISCIPLINE', 'STREAK', '{"days":30,"minSolved":1}', 30, '/achievements/iron_streak_30.svg', 20),
    ('IRON_STREAK_100', 'Железный стрик III', 'Решать минимум 1 задачу 100 дней подряд', 'DISCIPLINE', 'STREAK', '{"days":100,"minSolved":1}', 100, '/achievements/iron_streak_100.svg', 30),
    ('DEADLINE_STORM', 'Гроза дедлайнов', 'Сдать ДЗ в течение 2 часов после назначения', 'DISCIPLINE', 'DEADLINE_WINDOW', '{"hours":2}', 1, '/achievements/deadline_storm.svg', 40),
    ('NIGHT_WATCH', 'Ночной дозор', 'Успешно решить 5 задач после полуночи', 'DISCIPLINE', 'COUNTER_TIME_WINDOW', '{"startHour":0,"endHour":5,"correctOnly":true}', 5, '/achievements/night_watch.svg', 50),

    ('PART1_LORD', 'Властелин первой части', 'Решить 50 задач №1–12 без ошибок', 'MASTERY', 'STREAK_FILTERED', '{"range":[1,12],"count":50,"correctOnly":true}', 50, '/achievements/part1_lord.svg', 60),
    ('PARAM_HUNTER', 'Истребитель параметров', 'Получить максимум за №18 пять раз подряд', 'MASTERY', 'STREAK_FILTERED', '{"egeNumber":18,"maxScoreOnly":true,"count":5}', 5, '/achievements/param_hunter.svg', 70),
    ('SNIPER_WEEK', 'Снайпер', '100% точность за неделю при минимум 20 задачах', 'MASTERY', 'WEEKLY_PERFECT', '{"minSolved":20,"accuracy":100}', 1, '/achievements/sniper_week.svg', 80),

    ('BEAUTIFUL_COMEBACK', 'Красивый камбэк', 'После 3 ошибок подряд решить задачу в этой теме', 'GROWTH', 'RECOVERY', '{"errorsInRow":3}', 1, '/achievements/beautiful_comeback.svg', 90),
    ('FORECAST_SHIFT_10', 'Сдвиг с мертвой точки', 'Поднять прогноз балла на 10 пунктов за месяц', 'GROWTH', 'FORECAST_DELTA', '{"delta":10,"days":30}', 10, '/achievements/forecast_shift_10.svg', 100),

    ('EGE_SPEEDRUN', 'Спидраннер ЕГЭ', 'Решить тестовую часть < 30 минут без ошибок', 'SPEED', 'SPEEDRUN', '{"maxMinutes":30,"part":"first"}', 1, '/achievements/ege_speedrun.svg', 110),
    ('FIRST_BLOOD', 'Первая кровь', 'Получить первые 100% за домашнее задание от ИИ', 'SPEED', 'FIRST_PERFECT_AI_HOMEWORK', '{"score":100}', 1, '/achievements/first_blood.svg', 120),

    ('DAILY_CHALLENGE_5', 'Задача дня', 'Закрыть 5 ежедневных задач', 'GROWTH', 'COUNTER', '{"event":"DAILY_CHALLENGE_COMPLETED"}', 5, '/achievements/daily_challenge.svg', 130)
ON CONFLICT (achievement_key) DO NOTHING;
