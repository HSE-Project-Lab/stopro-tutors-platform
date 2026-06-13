package ru.stopro.dto.chat;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

public record ChatDto(
		UUID id,
		String chatType,
		UUID teacherId,
		String chatName,
		String chatAvatarUrl,
		String status,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime lastMessageAt,

		Integer unreadCount,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime createdAt,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime updatedAt
) {
}