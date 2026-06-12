package ru.stopro.dto.chat;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * Информация о прочтении сообщения одним пользователем: кто и когда.
 */
public record MessageReadInfoDto(
		UUID userId,
		String userName,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime readAt
) {
}
