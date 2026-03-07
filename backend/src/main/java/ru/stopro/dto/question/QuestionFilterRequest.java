package ru.stopro.dto.question;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.enums.QuestionType;
import ru.stopro.domain.enums.TaskDifficulty;
import ru.stopro.domain.enums.TaskSource;

/**
 * DTO для фильтрации вопросов при поиске
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionFilterRequest {

	/**
	 * Фильтр по теме
	 */
	private UUID topicId;

	/**
	 * Фильтр по номеру задания ЕГЭ (1-19)
	 */
	private Integer egeNumber;

	/**
	 * Фильтр по нескольким номерам ЕГЭ
	 */
	private List<Integer> egeNumbers;

	/**
	 * Фильтр по сложности
	 */
	private TaskDifficulty difficulty;

	/**
	 * Фильтр по нескольким сложностям
	 */
	private List<TaskDifficulty> difficulties;

	/**
	 * Фильтр по типу вопроса
	 */
	private QuestionType questionType;

	/**
	 * Фильтр по источнику
	 */
	private TaskSource source;

	/**
	 * Фильтр по году источника
	 */
	private Integer sourceYear;

	/**
	 * Только верифицированные
	 */
	private Boolean isVerified;

	/**
	 * Только с решением
	 */
	private Boolean hasSolution;

	/**
	 * Только с изображением
	 */
	private Boolean hasImage;

	/**
	 * Текстовый поиск по содержимому
	 */
	private String searchQuery;

	/**
	 * Поиск по тегам
	 */
	private List<String> tags;

	/**
	 * ID автора (учителя)
	 */
	private UUID authorId;

	/**
	 * Исключить определённые вопросы (для генерации вариантов без повторов)
	 */
	private List<UUID> excludeIds;

	/**
	 * Только вопросы, которые ученик ещё не решал
	 */
	private UUID excludeSolvedByStudentId;

	/**
	 * Только вопросы, которые ученик решил неправильно (для повторения)
	 */
	private UUID onlyIncorrectByStudentId;

	/**
	 * Минимальный success rate
	 */
	private Double minSuccessRate;

	/**
	 * Максимальный success rate
	 */
	private Double maxSuccessRate;

	/**
	 * Сортировка
	 */
	@Builder.Default
	private SortField sortBy = SortField.CREATED_AT;

	/**
	 * Направление сортировки
	 */
	@Builder.Default
	private SortDirection sortDirection = SortDirection.DESC;

	/**
	 * Поля для сортировки
	 */
	public enum SortField {
		CREATED_AT, EGE_NUMBER, DIFFICULTY, SUCCESS_RATE, TIMES_ATTEMPTED, POINTS
	}

	/**
	 * Направление сортировки
	 */
	public enum SortDirection {
		ASC, DESC
	}
}
