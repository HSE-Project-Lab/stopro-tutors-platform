package ru.stopro.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.entity.StudentAssignmentSubmission;
import ru.stopro.domain.entity.StudyGroup;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AssignmentStatus;
import ru.stopro.dto.teacher.TeacherActiveAssignmentDto;
import ru.stopro.dto.teacher.TeacherActivityEventDto;
import ru.stopro.dto.teacher.TeacherDashboardDto;
import ru.stopro.dto.teacher.TeacherDashboardStatsDto;
import ru.stopro.repository.AssignmentRepository;
import ru.stopro.repository.StudentAssignmentSubmissionRepository;
import ru.stopro.repository.StudyGroupRepository;
import ru.stopro.repository.UserRepository;

/**
 * Сервис дашборда для преподавателя.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherDashboardService {

    private final UserRepository userRepository;
    private final StudyGroupRepository groupRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentAssignmentSubmissionRepository submissionRepository;

    private static final String[] MOTIVATIONAL_PHRASES = {
        "Сегодня отличный день, чтобы поднять сдаваемость по ключевым темам.",
        "Небольшой ежедневный фокус на слабых местах даёт большой прирост к экзамену.",
        "Одна сильная домашка сегодня — более уверенный результат завтра.",
        "Держите ритм: регулярная практика групп уже даёт заметный прогресс."
    };

    /**
     * Получить данные для дашборда учителя.
     */
    public TeacherDashboardDto getDashboardData(UUID teacherUserId) {
        User teacher = userRepository.findById(teacherUserId)
            .orElseThrow(() -> new RuntimeException("Учитель не найден"));

        String greeting = getGreeting();
        String motivationalText = MOTIVATIONAL_PHRASES[(int) (Math.random() * MOTIVATIONAL_PHRASES.length)];

        TeacherDashboardStatsDto stats = buildStats(teacherUserId);
        List<TeacherActiveAssignmentDto> activeAssignments = buildActiveAssignments(teacherUserId);
        List<TeacherActivityEventDto> recentActivity = buildRecentActivity(teacherUserId);

        return TeacherDashboardDto.builder()
            .greeting(greeting)
            .motivationalText(motivationalText)
            .stats(stats)
            .activeAssignments(activeAssignments)
            .recentActivity(recentActivity)
            .build();
    }

    /**
     * Построить статистику учителя.
     */
    private TeacherDashboardStatsDto buildStats(UUID teacherUserId) {
        List<StudyGroup> groups = groupRepository.findByTeacherId(teacherUserId);
        Set<UUID> studentIds = groups.stream()
            .flatMap(g -> g.getStudents().stream())
            .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
            .map(User::getId)
            .collect(Collectors.toSet());

        int activeStudents = (int) studentIds.stream()
            .filter(this::isStudentActive)
            .count();

        int newStudentsThisWeek = countNewStudentsThisWeek(teacherUserId);

        LocalDateTime weekAgo = LocalDate.now().minusDays(7).atStartOfDay();
        List<Assignment> assignmentsThisWeek = assignmentRepository
            .findByTeacherIdAndCreatedAfter(teacherUserId, weekAgo);
        int assignmentsCount = assignmentsThisWeek.size();

        int groupsCount = groups.size();

        double averageSubmissionRate = calculateAverageSubmissionRate(teacherUserId);

        return TeacherDashboardStatsDto.builder()
            .activeStudents(activeStudents)
            .newStudentsThisWeek(newStudentsThisWeek)
            .assignmentsThisWeek(assignmentsCount)
            .groupsCount(groupsCount)
            .averageSubmissionRate(averageSubmissionRate)
            .build();
    }

    /**
     * Построить список активных домашних заданий.
     */
    private List<TeacherActiveAssignmentDto> buildActiveAssignments(UUID teacherUserId) {
        List<StudyGroup> groups = groupRepository.findByTeacherId(teacherUserId);
        if (groups.isEmpty()) {
            return List.of();
        }

        Set<UUID> groupIds = groups.stream()
            .map(StudyGroup::getId)
            .collect(Collectors.toSet());

        LocalDateTime now = LocalDateTime.now();
        List<Assignment> assignments = assignmentRepository
            .findByGroupIdInAndStatus(groupIds, AssignmentStatus.PUBLISHED);

        List<TeacherActiveAssignmentDto> result = new ArrayList<>();
        for (Assignment assignment : assignments) {
            if (assignment.getDeadline() != null && assignment.getDeadline().isBefore(now)) {
                continue;
            }

            int totalCount = 0;
            int submittedCount = 0;

            if (assignment.getGroup() != null) {
                totalCount = (int) assignment.getGroup().getStudents().stream()
                    .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                    .count();

                submittedCount = (int) submissionRepository
                    .countByAssignment_IdAndStudent_IdIn(assignment.getId(), 
                        assignment.getGroup().getStudents().stream()
                            .map(User::getId)
                            .collect(Collectors.toList()));
            }

            String dueLabel = getDueLabel(assignment.getDeadline());

            result.add(TeacherActiveAssignmentDto.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .groupName(assignment.getGroup() != null ? assignment.getGroup().getName() : "")
                .deadline(assignment.getDeadline())
                .submittedCount(submittedCount)
                .totalCount(totalCount)
                .dueLabel(dueLabel)
                .build());
        }

        return result.stream()
            .sorted((a, b) -> {
                if ("Просрочено".equals(a.getDueLabel())) return -1;
                if ("Просрочено".equals(b.getDueLabel())) return 1;
                if ("Сегодня".equals(a.getDueLabel())) return -1;
                if ("Сегодня".equals(b.getDueLabel())) return 1;
                return 0;
            })
            .limit(5)
            .collect(Collectors.toList());
    }

    /**
     * Построить ленту недавних событий.
     */
    private List<TeacherActivityEventDto> buildRecentActivity(UUID teacherUserId) {
        List<TeacherActivityEventDto> events = new ArrayList<>();

        List<StudyGroup> groups = groupRepository.findByTeacherId(teacherUserId);
        if (groups.isEmpty()) {
            return events;
        }

        Set<UUID> studentIds = groups.stream()
            .flatMap(g -> g.getStudents().stream())
            .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
            .map(User::getId)
            .collect(Collectors.toSet());

        List<StudentAssignmentSubmission> submissions = submissionRepository
            .findTop20ByStudent_IdInOrderBySubmittedAtDesc(studentIds);

        for (StudentAssignmentSubmission sub : submissions) {
            if (sub.getSubmittedAt() == null || sub.getAssignment() == null) {
                continue;
            }

            String text = String.format("%s сдал ДЗ «%s» (Результат: %d%%)",
                sub.getStudent().getFullName(),
                sub.getAssignment().getTitle(),
                sub.getScorePercent());

            events.add(TeacherActivityEventDto.builder()
                .id("sub-" + sub.getId())
                .type("completion")
                .text(text)
                .timestamp(sub.getSubmittedAt())
                .build());
        }

        for (StudyGroup group : groups) {
            List<User> recentStudents = group.getStudents().stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .filter(s -> {
                    if (s.getCreatedAt() == null) return false;
                    return s.getCreatedAt().isAfter(LocalDateTime.now().minusDays(3));
                })
                .limit(3)
                .toList();

            for (User student : recentStudents) {
                events.add(TeacherActivityEventDto.builder()
                    .id("join-" + student.getId())
                    .type("join")
                    .text(String.format("%s присоединился к группе «%s»",
                        student.getFullName(), group.getName()))
                    .timestamp(student.getCreatedAt())
                    .build());
            }
        }

        return events.stream()
            .sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()))
            .limit(5)
            .collect(Collectors.toList());
    }

    /**
     * Проверить, активен ли студент.
     */
    private boolean isStudentActive(UUID studentId) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        return submissionRepository.existsByStudent_IdAndSubmittedAtAfter(studentId, thirtyDaysAgo);
    }

    /**
     * Посчитать новых студентов за неделю.
     */
    private int countNewStudentsThisWeek(UUID teacherUserId) {
        LocalDateTime weekAgo = LocalDate.now().minusDays(7).atStartOfDay();
        List<StudyGroup> groups = groupRepository.findByTeacherId(teacherUserId);
        
        long count = groups.stream()
            .flatMap(g -> g.getStudents().stream())
            .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
            .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().isAfter(weekAgo))
            .count();
        
        return (int) count;
    }

    /**
     * Рассчитать средний процент сдачи ДЗ.
     */
    private double calculateAverageSubmissionRate(UUID teacherUserId) {
        List<StudyGroup> groups = groupRepository.findByTeacherId(teacherUserId);
        if (groups.isEmpty()) {
            return 0.0;
        }

        Set<UUID> studentIds = groups.stream()
            .flatMap(g -> g.getStudents().stream())
            .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
            .map(User::getId)
            .collect(Collectors.toSet());

        if (studentIds.isEmpty()) {
            return 0.0;
        }

        List<Assignment> assignments = assignmentRepository.findByGroupIdIn(groups.stream()
            .map(StudyGroup::getId)
            .collect(Collectors.toSet()));

        if (assignments.isEmpty()) {
            return 0.0;
        }

        int totalSubmissions = 0;
        int totalPossible = 0;

        for (Assignment assignment : assignments) {
            if (assignment.getGroup() == null) continue;
            
            int studentsCount = (int) assignment.getGroup().getStudents().stream()
                .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
                .count();
            
            int submissionsCount = (int) submissionRepository
                .countByAssignment_IdAndStudent_IdIn(assignment.getId(),
                    assignment.getGroup().getStudents().stream()
                        .map(User::getId)
                        .collect(Collectors.toList()));

            totalSubmissions += submissionsCount;
            totalPossible += studentsCount;
        }

        return totalPossible > 0 ? Math.round((double) totalSubmissions / totalPossible * 100) : 0.0;
    }

    /**
     * Получить приветствие по времени суток.
     */
    private String getGreeting() {
        int hour = LocalDate.now().getHour();
        if (hour < 12) return "Доброе утро";
        if (hour < 18) return "Добрый день";
        return "Добрый вечер";
    }

    /**
     * Получить метку дедлайна.
     */
    private String getDueLabel(LocalDateTime deadline) {
        if (deadline == null) return "";
        
        LocalDate today = LocalDate.now();
        LocalDate deadlineDate = deadline.toLocalDate();

        if (deadlineDate.isBefore(today)) {
            return "Просрочено";
        } else if (deadlineDate.isEqual(today)) {
            return "Сегодня";
        } else if (deadlineDate.isEqual(today.plusDays(1))) {
            return "Завтра";
        } else {
            return deadlineDate.getDayOfMonth() + " " + 
                deadlineDate.getMonth().getDisplayName(TextStyle.GENITIVE, new Locale("ru", "RU"));
        }
    }
}
