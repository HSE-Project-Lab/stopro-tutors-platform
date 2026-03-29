package ru.stopro.dto.question;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.enums.QuestionType;
import ru.stopro.domain.enums.TaskDifficulty;
import ru.stopro.domain.enums.TaskSource;

/**
 * DTO для создания вопроса (с поддержкой LaTeX)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionCreateRequest {

	@NotNull(message = "ID темы обязателен")
	private UUID topicId;

	@NotNull(message = "Номер задания ЕГЭ обязателен")
	@Min(value = 1, message = "Номер задания от 1 до 19")
	@Max(value = 19, message = "Номер задания от 1 до 19")
	private Integer egeNumber;

	@NotNull(message = "Сложность обязательна")
	private TaskDifficulty difficulty;

	@NotNull(message = "Тип вопроса обязателен")
	private QuestionType questionType;

	/**
	 * Условие задачи с поддержкой LaTeX
	 * 
	 * Примеры использования LaTeX: - Inline формулы: $x^2 + 2x + 1 = 0$ - Блочные
	 * формулы: $$\frac{-b \pm \sqrt{D}}{2a}$$ - Дроби: $\frac{1}{2}$ - Корни:
	 * $\sqrt{x}$, $\sqrt[3]{x}$ - Тригонометрия: $\sin x$, $\cos 2\alpha$ -
	 * Логарифмы: $\log_2 8$, $\ln x$
	 */
	@NotBlank(message = "Условие задачи обязательно")
	@Size(min = 10, max = 10000, message = "Условие от 10 до 10000 символов")
	private String content;

	/**
	 * Правильный ответ
	 * 
	 * Поддерживаемые форматы: - Число: "42", "-3.14", "0.5" - Дробь: "1/2", "-3/4"
	 * - Выражение: "2*sqrt(3)", "pi/6" - Множество: "{1, 2, 3}" - Интервал: "(-inf,
	 * 2) ∪ (3, +inf)"
	 */
	@NotBlank(message = "Ответ обязателен")
	@Size(max = 1000, message = "Ответ не более 1000 символов")
	private String answer;

	/**
	 * Получить правильный ответ (для совместимости)
	 */
	public String getCorrectAnswer() {
		return answer;
	}

	/**
	 * Получить тип вопроса (для совместимости)
	 */
	public QuestionType getType() {
		return questionType;
	}

	/**
	 * Получить варианты ответов (для совместимости)
	 */
	public List<String> getAnswerOptions() {
		return java.util.Collections.emptyList();
	}

	/**
	 * Получить изображения (для совместимости)
	 */
	public List<String> getImages() {
		java.util.List<String> images = new java.util.ArrayList<>();
		if (imageUrl != null) {
			images.add(imageUrl);
		}
		if (additionalImages != null) {
			images.addAll(additionalImages);
		}
		return images;
	}

	/**
	 * Является ли вопрос публичным (для совместимости)
	 */
	public Boolean isPublic() {
		return true;
	}

	/**
	 * Альтернативные формы ответа Например: ["0.5", "1/2", "0,5"]
	 */
	private List<String> alternativeAnswers;

	/**
	 * Развёрнутое решение с LaTeX
	 */
	@Size(max = 20000, message = "Решение не более 20000 символов")
	private String solution;

	/**
	 * Пошаговое решение Каждый шаг содержит: step, text, latex
	 */
	private List<SolutionStep> stepByStepSolution;

	/**
	 * Подсказка для ученика
	 */
	@Size(max = 2000, message = "Подсказка не более 2000 символов")
	private String hint;

	/**
	 * Типичные ошибки при решении
	 */
	private List<CommonMistake> commonMistakes;

	private String imageUrl;
	private List<String> additionalImages;
	private String diagramSvg;
	private String geogebraId;

	@Min(value = 1, message = "Минимум 1 балл")
	@Max(value = 10, message = "Максимум 10 баллов")
	private Integer points;

	@Min(value = 1, message = "Минимум 1 минута")
	@Max(value = 60, message = "Максимум 60 минут")
	private Integer estimatedTimeMinutes;

	private TaskSource source;
	private Integer sourceYear;
	private Integer sourceVariant;
	private String sourceUrl;

	private List<String> tags;
	private String keywords;
	private List<String> prerequisites;

	/**
	 * Шаг решения
	 */
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class SolutionStep {
		private Integer step;
		private String text;
		private String latex;
	}

	/**
	 * Типичная ошибка
	 */
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CommonMistake {
		private String type;
		private String description;
		private String example;
	}
}
