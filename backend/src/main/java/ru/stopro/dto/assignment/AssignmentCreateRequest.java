package ru.stopro.dto.assignment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для создания задания вручную
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentCreateRequest {

	@NotBlank(message = "Название обязательно")
	@Size(min = 3, max = 200, message = "Название должно быть от 3 до 200 символов")
	private String title;

	private String description;

	private String instructions;

	@NotNull(message = "Группа обязательна")
	private UUID groupId;

	@NotEmpty(message = "Выберите хотя бы одну задачу")
	private List<UUID> questionIds;

	@NotNull(message = "Дедлайн обязателен")
	@Future(message = "Дедлайн должен быть в будущем")
	private LocalDateTime deadline;

	@Min(value = 5, message = "Минимум 5 минут")
	@Max(value = 300, message = "Максимум 300 минут")
	private Integer timeLimitMinutes;

	@Min(value = 1, message = "Минимум 1 попытка")
	@Max(value = 10, message = "Максимум 10 попыток")
	private Integer maxAttempts;

	@Builder.Default
	private boolean showAnswersAfterCompletion = true;

	@Builder.Default
	private boolean showSolutionsAfterCompletion = false;

	@Builder.Default
	private boolean showImmediateFeedback = false;

	@Builder.Default
	private boolean shuffleQuestions = false;
}
