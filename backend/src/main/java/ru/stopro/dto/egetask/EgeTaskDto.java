package ru.stopro.dto.egetask;

import lombok.Builder;
import lombok.Data;
import ru.stopro.domain.enums.TaskDifficulty;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class EgeTaskDto {
    private String id;
    private String parentId;
    private Integer egeNumber;
    private String topic;
    private TaskDifficulty difficulty;
    private String content;
    private String solution;
    private String answer;
    private List<String> imageUrls;
    private List<EgeTaskDto> variants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}