ALTER TABLE assignments
    DROP CONSTRAINT fk_assignments_group;

ALTER TABLE assignments
    ADD CONSTRAINT fk_assignments_group
        FOREIGN KEY (group_id)
        REFERENCES study_groups (id)
        ON DELETE SET NULL;
