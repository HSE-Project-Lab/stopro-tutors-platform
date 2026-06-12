package ru.stopro.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Запрос на обновление названия группового чата.
 */
public record UpdateGroupChatRequest(
	@NotBlank(message = "Название группы не может быть пустым")
	@Size(min = 1, max = 255, message = "Название группы должно содержать от 1 до 255 символов")
	String chatName,

	String chatAvatarUrl
) {
}

