package ru.stopro.dto.assignment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.enums.AssignmentType;
import ru.stopro.domain.enums.TaskDifficulty;

/**
 * DTO для автоматической генерации варианта/теста
 * 
 * Позволяет задать критерии для автоматического подбора задач из базы
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenerateAssignmentRequest {

	@NotBlank(message = "Название обязательно")
	@Size(max = 255, message = "Название не более 255 символов")
	private String title;

	@Size(max = 2000, message = "Описание не более 2000 символов")
	private String description;

	private String instructions;

	@NotNull(message = "ID группы обязателен")
	private UUID groupId;

	@NotNull(message = "Тип задания обязателен")
	@Builder.Default
	private AssignmentType assignmentType = AssignmentType.HOMEWORK;

	/**
	 * Общее количество вопросов в варианте
	 */
	@NotNull(message = "Количество вопросов обязательно")
	@Min(value = 1, message = "Минимум 1 вопрос")
	@Max(value = 50, message = "Максимум 50 вопросов")
	private Integer totalQuestions;

	/**
	 * Получить количество вопросов (для совместимости)
	 */
	public Integer getQuestionCount() {
		return totalQuestions;
	}

	/**
	 * Перемешать вопросы (для совместимости)
	 */
	public Boolean isShuffleQuestions() {
		return shuffleQuestions;
	}

	/**
	 * Показывать ответы после завершения (для совместимости)
	 */
	public Boolean isShowAnswersAfterCompletion() {
		return showCorrectAnswers;
	}

	/**
	 * Показывать решения после завершения (для совместимости)
	 */
	public Boolean isShowSolutionsAfterCompletion() {
		return showSolutions;
	}

	/**
	 * Распределение по темам Ключ: UUID темы, Значение: количество вопросов
	 * 
	 * Пример: {"topic-uuid-1": 3, "topic-uuid-2": 2}
	 */
	private Map<UUID, Integer> topicDistribution;

	/**
	 * Распределение по номерам заданий ЕГЭ Ключ: номер ЕГЭ (1-19), Значение:
	 * количество вопросов
	 * 
	 * Пример: {"1": 1, "2": 1, "5": 2, "13": 1}
	 */
	private Map<Integer, Integer> egeNumberDistribution;

	/**
	 * Конкретные номера ЕГЭ для включения в вариант Если задано, будет выбрано по
	 * одному вопросу каждого номера
	 */
	private List<Integer> egeNumbers;

	/**
	 * Распределение по сложности
	 * 
	 * Пример: {"EASY": 5, "MEDIUM": 10, "HARD": 4}
	 */
	private Map<TaskDifficulty, Integer> difficultyDistribution;

	/**
	 * ID вопросов для исключения (чтобы не повторять уже решённые задачи)
	 */
	private List<UUID> excludeQuestionIds;

	/**
	 * Исключить вопросы, которые ученики группы уже решали
	 */
	@Builder.Default
	private Boolean excludePreviouslySolved = false;

	/**
	 * Включить авторские задачи учителя
	 */
	@Builder.Default
	private Boolean includeTeacherQuestions = true;

	/**
	 * Только верифицированные вопросы
	 */
	@Builder.Default
	private Boolean onlyVerified = false;

	/**
	 * Перемешать порядок вопросов
	 */
	@Builder.Default
	private Boolean shuffleQuestions = true;

	/**
	 * Минимальный success rate вопросов (0-100) Для создания более лёгкого/сложного
	 * варианта
	 */
	private Double minSuccessRate;

	/**
	 * Максимальный success rate вопросов (0-100)
	 */
	private Double maxSuccessRate;

	@NotNull(message = "Дедлайн обязателен")
	@Future(message = "Дедлайн должен быть в будущем")
	private LocalDateTime deadline;

	private LocalDateTime startDate;

	private LocalDateTime softDeadline;

	@Min(value = 0, message = "Штраф от 0 до 100%")
	@Max(value = 100, message = "Штраф от 0 до 100%")
	private Integer latePenaltyPercent;

	/**
	 * Ограничение времени на выполнение (минуты) null = без ограничения
	 */
	private Integer timeLimitMinutes;

	/**
	 * Максимальное количество попыток
	 */
	@Builder.Default
	private Integer maxAttempts = 1;

	/**
	 * Показывать правильные ответы
	 */
	@Builder.Default
	private Boolean showCorrectAnswers = true;

	/**
	 * Показывать решения
	 */
	@Builder.Default
	private Boolean showSolutions = true;

	/**
	 * Показывать результат сразу после ответа
	 */
	@Builder.Default
	private Boolean showImmediateFeedback = false;

	/**
	 * Процент для сдачи
	 */
	@Min(value = 0, message = "Минимум 0%")
	@Max(value = 100, message = "Максимум 100%")
	@Builder.Default
	private Integer passingScorePercent = 60;

	/**
	 * Сохранить как шаблон
	 */
	@Builder.Default
	private Boolean saveAsTemplate = false;
}
