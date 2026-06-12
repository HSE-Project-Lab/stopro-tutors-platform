package ru.stopro.dto.chat;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Запрос на отправку сообщения в чат через WebSocket.
 */
public record SendMessageRequest(
	@NotBlank(message = "Содержание сообщения не может быть пустым")
	@Size(min = 1, max = 4096, message = "Сообщение должно содержать от 1 до 4096 символов")
	String content
) {
}

