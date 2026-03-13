-- V12__null_deadline_for_templates.sql
-- Allow assignments to have a NULL deadline for templates

ALTER TABLE assignments
ALTER COLUMN deadline DROP NOT NULL;
