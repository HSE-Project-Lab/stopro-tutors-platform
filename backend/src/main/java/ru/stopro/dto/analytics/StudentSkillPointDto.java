package ru.stopro.dto.analytics;

import lombok.Builder;
import lombok.Value;

/**
 * Точка данных для radar-чарта навыков ученика.
 */
@Value
@Builder
public class StudentSkillPointDto {
    /** Название навыка/предмета */
    String subject;
    
    /** Текущее значение (0-100) */
    Double value;
    
    /** Максимальное значение (обычно 100) */
    Integer fullMark;
}
