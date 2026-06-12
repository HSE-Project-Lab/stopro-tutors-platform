package ru.stopro.dto.chat;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

public record PersonalChatDto(
		UUID id,
		String chatType,
		UUID counterpartId,
		String counterpartName,
		String counterpartAvatarUrl,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime lastMessageAt,

		Integer unreadCount,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime createdAt
) {
}
