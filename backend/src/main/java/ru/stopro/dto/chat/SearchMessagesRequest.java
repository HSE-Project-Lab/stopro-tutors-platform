package ru.stopro.dto.chat;

/**
 * Запрос на поиск сообщений в чате.
 */
public record SearchMessagesRequest(
	String query,
	Integer page,
	Integer pageSize
) {
}

