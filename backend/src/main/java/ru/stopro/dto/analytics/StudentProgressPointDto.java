package ru.stopro.dto.analytics;

import lombok.Builder;
import lombok.Value;

/**
 * Точка данных для графика прогноза баллов ЕГЭ.
 */
@Value
@Builder
public class StudentProgressPointDto {
    /** Метка периода (месяц) */
    String monthLabel;
    
    /** Прогнозируемый балл */
    Integer predictedScore;
}
