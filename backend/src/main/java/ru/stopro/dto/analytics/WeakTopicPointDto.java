package ru.stopro.dto.analytics;

import lombok.Builder;
import lombok.Value;

/**
 * Точка данных для списка слабых тем ученика.
 */
@Value
@Builder
public class WeakTopicPointDto {
    /** Номер задания ЕГЭ */
    Integer taskNumber;
    
    /** Название темы */
    String topicName;
    
    /** Процент успешности (0-100) */
    Double successRate;
    
    /** Количество практик/попыток */
    Integer practiceCount;
}
