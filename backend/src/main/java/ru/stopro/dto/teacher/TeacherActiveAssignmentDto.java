package ru.stopro.dto.teacher;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Value;

/**
 * DTO для активного домашнего задания на дашборде учителя.
 */
@Value
@Builder
public class TeacherActiveAssignmentDto {
    UUID id;
    String title;
    String groupName;
    LocalDateTime deadline;
    int submittedCount;
    int totalCount;
    String dueLabel;
}
