package ru.stopro.dto.chat;

import java.time.LocalDateTime;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * Событие WebSocket-канала чата.
 * Оборачивает все типы событий (отправка, редактирование, удаление, закрепление, прочтение).
 */
public record ChatEvent(
		String type,
		ChatMessageDto message,
		UUID messageId,
		UUID readerId,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime readAt
) {

	public static ChatEvent sent(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_SENT", message, null, null, null);
	}

	public static ChatEvent edited(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_EDITED", message, null, null, null);
	}

	public static ChatEvent deleted(UUID messageId) {
		return new ChatEvent("MESSAGE_DELETED", null, messageId, null, null);
	}

	public static ChatEvent pinned(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_PINNED", message, null, null, null);
	}

	public static ChatEvent unpinned(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_UNPINNED", message, null, null, null);
	}

	public static ChatEvent read(UUID messageId, UUID readerId, LocalDateTime readAt) {
		return new ChatEvent("MESSAGE_READ", null, messageId, readerId, readAt);
	}
}
