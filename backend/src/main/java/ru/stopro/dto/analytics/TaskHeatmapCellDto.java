package ru.stopro.dto.analytics;

import lombok.Builder;
import lombok.Value;

/**
 * Ячейка тепловой карты для конкретного задания ЕГЭ.
 */
@Value
@Builder
public class TaskHeatmapCellDto {
    /** Номер задания ЕГЭ (1-19) */
    Integer taskNumber;
    
    /** Процент успешности (0-100) */
    Double successRate;
    
    /** Количество попыток */
    Integer attempts;
}
