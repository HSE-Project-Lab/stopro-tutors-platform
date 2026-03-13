package ru.stopro.dto.assignment;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublishTemplateRequest {
	private UUID groupId;
	private UUID studentId;
	private LocalDateTime deadline;
}
