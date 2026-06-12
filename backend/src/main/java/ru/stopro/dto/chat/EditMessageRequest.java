package ru.stopro.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Запрос на редактирование сообщения.
 */
public record EditMessageRequest(
	@NotBlank(message = "Содержание сообщения не может быть пустым")
	@Size(min = 1, max = 4096, message = "Сообщение должно содержать от 1 до 4096 символов")
	String content
) {
}

