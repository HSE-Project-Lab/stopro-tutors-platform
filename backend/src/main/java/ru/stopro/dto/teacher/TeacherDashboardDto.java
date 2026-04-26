package ru.stopro.dto.teacher;

import java.util.List;

import lombok.Builder;
import lombok.Value;

/**
 * DTO для дашборда учителя.
 */
@Value
@Builder
public class TeacherDashboardDto {
    String greeting;
    String motivationalText;
    TeacherDashboardStatsDto stats;
    List<TeacherActiveAssignmentDto> activeAssignments;
    List<TeacherActivityEventDto> recentActivity;
}
