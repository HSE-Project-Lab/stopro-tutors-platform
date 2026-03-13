CREATE TABLE assignment_ege_tasks (
    assignment_id UUID NOT NULL,
    ege_task_id   VARCHAR(255) NOT NULL,
    task_order    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (assignment_id, ege_task_id),
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (ege_task_id)   REFERENCES ege_tasks(id)   ON DELETE CASCADE
);

CREATE INDEX idx_assignment_ege_tasks_assignment ON assignment_ege_tasks(assignment_id);
CREATE INDEX idx_assignment_ege_tasks_task       ON assignment_ege_tasks(ege_task_id);
