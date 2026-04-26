package ru.stopro.dto.analytics;

import lombok.Builder;
import lombok.Value;
import java.util.List;

/**
 * Полный DTO аналитики ученика для преподавателя.
 * Используется в тепловой карте группы и детальном просмотре.
 */
@Value
@Builder
public class TeacherStudentHeatmapDto {
    /** ID ученика */
    String studentId;
    
    /** ФИО ученика */
    String studentName;
    
    /** ID группы */
    String groupId;
    
    /** Название группы */
    String groupName;
    
    /** Целевой балл ЕГЭ */
    Integer targetScore;
    
    /** Прогнозируемый балл ЕГЭ */
    Integer predictedEgeScore;
    
    /** Тепловая карта по заданиям №1-19 */
    List<TaskHeatmapCellDto> heatmap;
    
    /** Навыки для radar-чарта */
    List<StudentSkillPointDto> radarSkills;
    
    /** Слабые темы */
    List<WeakTopicPointDto> weakTopics;
    
    /** История прогноза баллов */
    List<StudentProgressPointDto> progressHistory;
    
    /** Статистика дисциплины */
    StudentDisciplineStatsDto discipline;
}
