-- V11: Change fk_assignments_group from ON DELETE RESTRICT to ON DELETE SET NULL.
-- Previously, deleting a study_group while assignments still referenced it caused
-- "violates foreign key constraint fk_assignments_group" (500 error).
-- With SET NULL the group_id on those assignments is cleared automatically.

ALTER TABLE assignments
    DROP CONSTRAINT fk_assignments_group;

ALTER TABLE assignments
    ADD CONSTRAINT fk_assignments_group
        FOREIGN KEY (group_id)
        REFERENCES study_groups (id)
        ON DELETE SET NULL;
