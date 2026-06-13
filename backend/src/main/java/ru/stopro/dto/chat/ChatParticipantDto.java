package ru.stopro.dto.chat;

import java.util.UUID;

/**
 * DTO для участника чата.
 */
public record ChatParticipantDto(
	UUID id,
	UUID userId,
	String userName,
	String userEmail,
	Integer unreadCount
) {
}

