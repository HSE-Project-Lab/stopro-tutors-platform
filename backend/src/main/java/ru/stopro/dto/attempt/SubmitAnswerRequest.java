package ru.stopro.dto.attempt;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для отправки ответа учеником
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequest {

	/**
	 * ID попытки (если уже начата)
	 */
	private UUID attemptId;

	/**
	 * ID вопроса
	 */
	@NotNull(message = "ID вопроса обязателен")
	private UUID questionId;

	/**
	 * ID задания (если решается в рамках ДЗ/теста)
	 */
	private UUID assignmentId;

	/**
	 * Ответ ученика
	 * 
	 * Поддерживаемые форматы: - Число: "42", "-3.14" - Дробь: "1/2" - Выражение:
	 * "2*sqrt(3)" - Множество ответов: "1;2;3" (для multiple choice)
	 */
	@Size(max = 5000, message = "Ответ не более 5000 символов")
	private String answer;

	/**
	 * Текст развёрнутого решения (для заданий части 2 ЕГЭ)
	 */
	@Size(max = 50000, message = "Решение не более 50000 символов")
	private String solutionText;

	/**
	 * URL загруженного изображения решения (для рукописных решений)
	 */
	@Size(max = 500, message = "URL не более 500 символов")
	private String solutionImageUrl;

	/**
	 * Получить изображение решения (для совместимости)
	 */
	public String getSolutionImage() {
		return solutionImageUrl;
	}

	/**
	 * Дополнительные изображения (JSON массив URL)
	 */
	private String additionalImages;

	/**
	 * Время, потраченное на решение (секунды) Передаётся с клиента для точности
	 */
	private Integer timeSpentSeconds;

	/**
	 * Флаг финального ответа (без права на изменение)
	 */
	@Builder.Default
	private Boolean isFinal = true;

	/**
	 * Метаданные сессии
	 */
	private String sessionId;

	/**
	 * Количество переключений вкладки (антифрод)
	 */
	private Integer tabSwitchesCount;

	/**
	 * Был ли обнаружен копипаст
	 */
	@Builder.Default
	private Boolean copyPasteDetected = false;
}
