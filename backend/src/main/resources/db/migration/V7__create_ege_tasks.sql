CREATE TABLE ege_tasks (
    id VARCHAR(255) PRIMARY KEY,
    ege_number INTEGER NOT NULL,
    topic VARCHAR(255) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    solution TEXT,
    answer VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ege_task_images (
    task_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(1000) NOT NULL,
    FOREIGN KEY (task_id) REFERENCES ege_tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_ege_tasks_number ON ege_tasks(ege_number);
CREATE INDEX idx_ege_tasks_topic ON ege_tasks(topic);
CREATE INDEX idx_ege_tasks_difficulty ON ege_tasks(difficulty);
CREATE INDEX idx_ege_task_images_task_id ON ege_task_images(task_id);