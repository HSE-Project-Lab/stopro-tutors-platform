package ru.stopro.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
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

import ru.stopro.domain.entity.Attempt;
import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.entity.Question;
import ru.stopro.domain.entity.StudentAssignmentSubmission;
import ru.stopro.domain.entity.StudentScoreForecast;
import ru.stopro.domain.entity.StudyGroup;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AttemptStatus;
import ru.stopro.dto.analytics.StudentDisciplineStatsDto;
import ru.stopro.dto.analytics.StudentProgressPointDto;
import ru.stopro.dto.analytics.StudentSkillPointDto;
import ru.stopro.dto.analytics.TaskHeatmapCellDto;
import ru.stopro.dto.analytics.TeacherStudentHeatmapDto;
import ru.stopro.dto.analytics.WeakTopicPointDto;
import ru.stopro.repository.AttemptRepository;
import ru.stopro.repository.EgeTaskRepository;
import ru.stopro.repository.StudentAssignmentSubmissionRepository;
import ru.stopro.repository.StudentScoreForecastRepository;
import ru.stopro.repository.StudyGroupRepository;
import ru.stopro.repository.UserRepository;

/**
 * Сервис аналитики для преподавателя.
 * Собирает реальную аналитику на основе действий учеников.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeacherAnalyticsService {

    private final UserRepository userRepository;
    private final StudyGroupRepository groupRepository;
    private final AttemptRepository attemptRepository;
    private final StudentAssignmentSubmissionRepository submissionRepository;
    private final StudentScoreForecastRepository forecastRepository;
    private final EgeTaskRepository egeTaskRepository;

    private static final String[] TEMES_EGE = {
        "Планиметрия", "Векторы", "Стереометрия", "Вероятность", "Логарифмы",
        "Тригонометрия", "Производная", "Первообразная", "Текстовые задачи",
        "Параметры", "Неравенства", "Экономические задачи", "Графики функций",
        "Системы уравнений", "Задача №15", "Задача №16", "Задача №17",
        "Задача №18", "Задача №19"
    };

    /**
     * Получить тепловую карту всех учеников учителя.
     */
    public List<TeacherStudentHeatmapDto> getStudentsHeatmap(UUID teacherUserId) {
        List<StudyGroup> groups = groupRepository.findByTeacherId(teacherUserId);
        if (groups.isEmpty()) {
            log.debug("Учитель {} не имеет групп", teacherUserId);
            return List.of();
        }

        Set<UUID> studentIds = groups.stream()
            .flatMap(g -> g.getStudents().stream())
            .filter(s -> !Boolean.TRUE.equals(s.getIsDeleted()))
            .map(User::getId)
            .collect(Collectors.toSet());

        if (studentIds.isEmpty()) {
            log.debug("В группах учителя {} нет студентов", teacherUserId);
            return List.of();
        }

        return studentIds.stream()
            .map(this::buildStudentHeatmap)
            .filter(dto -> dto != null)
            .collect(Collectors.toList());
    }

    /**
     * Построить полную аналитику для одного студента.
     */
    public TeacherStudentHeatmapDto buildStudentHeatmap(UUID studentId) {
        User student = userRepository.findById(studentId).orElse(null);
        if (student == null || Boolean.TRUE.equals(student.getIsDeleted())) {
            return null;
        }

        String groupId = "";
        String groupName = "";
        List<StudyGroup> groups = groupRepository.findAll().stream()
            .filter(g -> g.getStudents().stream().anyMatch(s -> s.getId().equals(studentId)))
            .toList();
        if (!groups.isEmpty()) {
            StudyGroup group = groups.get(0);
            groupId = group.getId().toString();
            groupName = group.getName();
        }

        Integer targetScore = 70;

        StudentScoreForecast forecast = forecastRepository
            .findTopByStudent_IdOrderByForecastDateDesc(studentId)
            .orElse(null);
        Integer predictedScore = forecast != null ? forecast.getPredictedScore() : null;

        List<TaskHeatmapCellDto> heatmap = buildHeatmap(studentId);

        List<StudentSkillPointDto> radarSkills = buildRadarSkills(studentId);

        List<WeakTopicPointDto> weakTopics = buildWeakTopics(heatmap);

        List<StudentProgressPointDto> progressHistory = buildProgressHistory(studentId);

        StudentDisciplineStatsDto discipline = buildDisciplineStats(studentId);

        return TeacherStudentHeatmapDto.builder()
            .studentId(studentId.toString())
            .studentName(student.getFullName())
            .groupId(groupId)
            .groupName(groupName)
            .targetScore(targetScore)
            .predictedEgeScore(predictedScore)
            .heatmap(heatmap)
            .radarSkills(radarSkills)
            .weakTopics(weakTopics)
            .progressHistory(progressHistory)
            .discipline(discipline)
            .build();
    }

    /**
     * Построить тепловую карту по заданиям ЕГЭ №1-19.
     */
    private List<TaskHeatmapCellDto> buildHeatmap(UUID studentId) {
        List<TaskHeatmapCellDto> heatmap = new ArrayList<>();

        for (int taskNumber = 1; taskNumber <= 19; taskNumber++) {
            List<Object[]> stats = attemptRepository.getStudentStatsByEgeNumberWithAttempts(studentId, taskNumber);
            
            int attempts = 0;
            Double successRate = null;

            if (!stats.isEmpty()) {
                Object[] row = stats.get(0);
                Long totalCount = (Long) row[0];
                Long correctCount = (Long) row[1];
                attempts = totalCount.intValue();
                if (totalCount > 0 && correctCount != null) {
                    successRate = (correctCount * 100.0) / totalCount;
                }
            }

            heatmap.add(TaskHeatmapCellDto.builder()
                .taskNumber(taskNumber)
                .attempts(attempts)
                .successRate(successRate)
                .build());
        }

        return heatmap;
    }

    /**
     * Построить radar навыков по предметам.
     */
    private List<StudentSkillPointDto> buildRadarSkills(UUID studentId) {
        Map<String, SkillAccumulator> skills = new HashMap<>();
        skills.put("Алгебра", new SkillAccumulator());
        skills.put("Геометрия", new SkillAccumulator());
        skills.put("Тригонометрия", new SkillAccumulator());
        skills.put("Параметры", new SkillAccumulator());
        skills.put("Вероятность", new SkillAccumulator());
        skills.put("Стереометрия", new SkillAccumulator());

        List<Object[]> egeStats = attemptRepository.getStudentStatsByEgeNumber(studentId);
        
        for (Object[] row : egeStats) {
            Integer egeNumber = (Integer) row[0];
            Long total = (Long) row[1];
            Long correct = (Long) row[2];

            if (total == 0) continue;

            double rate = (correct * 100.0) / total;
            String skill = mapEgeNumberToSkill(egeNumber);
            
            SkillAccumulator acc = skills.get(skill);
            if (acc != null) {
                acc.total += rate;
                acc.count++;
            }
        }

        return skills.entrySet().stream()
            .map(entry -> {
                double avg = entry.getValue().count > 0 
                    ? entry.getValue().total / entry.getValue().count 
                    : 0.0;
                return StudentSkillPointDto.builder()
                    .subject(entry.getKey())
                    .value(Math.round(avg * 10.0) / 10.0)
                    .fullMark(100)
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * Маппинг номера ЕГЭ на навык.
     */
    private String mapEgeNumberToSkill(Integer egeNumber) {
        if (egeNumber == null) return "Алгебра";
        if (egeNumber >= 1 && egeNumber <= 5) return "Алгебра";
        if (egeNumber >= 6 && egeNumber <= 8) return "Геометрия";
        if (egeNumber == 9 || egeNumber == 10) return "Тригонометрия";
        if (egeNumber == 12 || egeNumber == 17) return "Параметры";
        if (egeNumber == 11) return "Вероятность";
        if (egeNumber == 13 || egeNumber == 14) return "Стереометрия";
        return "Алгебра";
    }

    /**
     * Построить список слабых тем.
     */
    private List<WeakTopicPointDto> buildWeakTopics(List<TaskHeatmapCellDto> heatmap) {
        return heatmap.stream()
            .filter(cell -> cell.getSuccessRate() != null && cell.getSuccessRate() < 70)
            .map(cell -> WeakTopicPointDto.builder()
                .taskNumber(cell.getTaskNumber())
                .topicName(TEMES_EGE[cell.getTaskNumber() - 1])
                .successRate(cell.getSuccessRate())
                .practiceCount(cell.getAttempts())
                .build())
            .sorted(Comparator.comparingDouble(WeakTopicPointDto::getSuccessRate))
            .limit(5)
            .collect(Collectors.toList());
    }

    /**
     * Построить историю прогноза баллов.
     */
    private List<StudentProgressPointDto> buildProgressHistory(UUID studentId) {
        List<StudentScoreForecast> forecasts = forecastRepository
            .findByStudent_IdAndIsDeletedFalseOrderByForecastDateAsc(studentId);

        if (forecasts.isEmpty()) {
            StudentScoreForecast current = forecastRepository
                .findTopByStudent_IdOrderByForecastDateDesc(studentId)
                .orElse(null);
            
            if (current != null) {
                String monthLabel = LocalDate.now()
                    .getMonth()
                    .getDisplayName(TextStyle.SHORT, new Locale("ru", "RU"));
                return List.of(StudentProgressPointDto.builder()
                    .monthLabel(monthLabel)
                    .predictedScore(current.getPredictedScore())
                    .build());
            }
            return List.of();
        }

        return forecasts.stream()
            .map(f -> {
                String monthLabel = f.getForecastDate()
                    .getMonth()
                    .getDisplayName(TextStyle.SHORT, new Locale("ru", "RU"));
                return StudentProgressPointDto.builder()
                    .monthLabel(monthLabel)
                    .predictedScore(f.getPredictedScore())
                    .build();
            })
            .collect(Collectors.toList());
    }

    /**
     * Построить статистику дисциплины.
     */
    private StudentDisciplineStatsDto buildDisciplineStats(UUID studentId) {
        List<StudentAssignmentSubmission> submissions = submissionRepository
            .findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(studentId);

        int onTimeCount = 0;
        int totalCount = submissions.size();

        for (StudentAssignmentSubmission sub : submissions) {
            if (sub.getAssignment() != null && sub.getSubmittedAt() != null 
                && sub.getAssignment().getDeadline() != null) {
                if (!sub.getSubmittedAt().isAfter(sub.getAssignment().getDeadline())) {
                    onTimeCount++;
                }
            } else if (sub.getAssignment() == null) {
                onTimeCount++;
            }
        }

        int onTimeRate = totalCount > 0 ? (onTimeCount * 100) / totalCount : 0;

        Instant lastActiveAt = getLastActivityDate(studentId);

        return StudentDisciplineStatsDto.builder()
            .homeworkOnTimeRate(onTimeRate)
            .lastActiveAt(lastActiveAt)
            .build();
    }

    /**
     * Получить дату последней активности студента.
     */
    private Instant getLastActivityDate(UUID studentId) {
        // Последняя завершённая попытка
        List<Attempt> recentAttempts = attemptRepository.findRecentCompleted(studentId, 
            org.springframework.data.domain.PageRequest.of(0, 1));
        
        if (!recentAttempts.isEmpty()) {
            LocalDateTime lastAttempt = recentAttempts.get(0).getStartedAt();
            if (lastAttempt != null) {
                return lastAttempt.toInstant(ZoneOffset.UTC);
            }
        }

        // Или последняя отправка ДЗ
        List<StudentAssignmentSubmission> submissions = submissionRepository
            .findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(studentId);
        
        if (!submissions.isEmpty() && submissions.get(0).getSubmittedAt() != null) {
            return submissions.get(0).getSubmittedAt().toInstant(ZoneOffset.UTC);
        }

        return Instant.now();
    }

    /**
     * Проверить, является ли учитель преподавателем студента.
     */
    public boolean isTeacherOfStudent(UUID teacherId, UUID studentId) {
        List<StudyGroup> groups = groupRepository.findByTeacherId(teacherId);
        return groups.stream()
            .anyMatch(g -> g.getStudents().stream()
                .anyMatch(s -> s.getId().equals(studentId)));
    }

    /**
     * Вспомогательный класс для накопления статистики навыков.
     */
    private static class SkillAccumulator {
        double total = 0.0;
        int count = 0;
    }
}
