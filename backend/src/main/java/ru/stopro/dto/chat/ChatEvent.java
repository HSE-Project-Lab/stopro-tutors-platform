package ru.stopro.dto.chat;

import java.util.UUID;

/**
 * Событие WebSocket-канала чата.
 * Оборачивает все типы событий (отправка, редактирование, удаление, закрепление).
 */
public record ChatEvent(String type, ChatMessageDto message, UUID messageId) {

	public static ChatEvent sent(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_SENT", message, null);
	}

	public static ChatEvent edited(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_EDITED", message, null);
	}

	public static ChatEvent deleted(UUID messageId) {
		return new ChatEvent("MESSAGE_DELETED", null, messageId);
	}

	public static ChatEvent pinned(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_PINNED", message, null);
	}

	public static ChatEvent unpinned(ChatMessageDto message) {
		return new ChatEvent("MESSAGE_UNPINNED", message, null);
	}
}
