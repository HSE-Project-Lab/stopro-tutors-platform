package ru.stopro.dto.analytics;

import lombok.Builder;
import lombok.Value;
import java.time.Instant;

/**
 * Статистика дисциплины ученика.
 */
@Value
@Builder
public class StudentDisciplineStatsDto {
    /** Процент сданных ДЗ в срок (0-100) */
    Integer homeworkOnTimeRate;
    
    /** Дата последней активности */
    Instant lastActiveAt;
}
