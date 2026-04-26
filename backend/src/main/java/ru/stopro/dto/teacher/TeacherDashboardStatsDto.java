package ru.stopro.dto.teacher;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Value;

/**
 * DTO для статистики учителя на дашборде.
 */
@Value
@Builder
public class TeacherDashboardStatsDto {
    int activeStudents;
    int newStudentsThisWeek;
    int assignmentsThisWeek;
    int groupsCount;
    double averageSubmissionRate;
}
