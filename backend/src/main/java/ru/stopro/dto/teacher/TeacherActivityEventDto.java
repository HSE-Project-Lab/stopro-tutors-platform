package ru.stopro.dto.teacher;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Value;

/**
 * DTO для события активности на дашборде учителя.
 */
@Value
@Builder
public class TeacherActivityEventDto {
    String id;
    String type;
    String text;
    LocalDateTime timestamp;
}
