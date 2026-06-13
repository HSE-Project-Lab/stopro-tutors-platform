package ru.stopro.dto.chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonFormat;

public record ChatMessageDto(
		UUID id,
		UUID chatId,
		UUID senderId,
		String senderName,
		String messageType,
		String content,
		List<AttachmentDto> attachments,
		Boolean isEdited,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime editedAt,

		Boolean isPinned,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime pinnedAt,

		UUID pinnedById,
		Integer readCount,
		Boolean isReadByCurrentUser,
		List<UUID> readByUserIds,

		UUID replyToId,
		UUID replyToSenderId,
		String replyToSenderName,
		String replyToPreview,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime createdAt,

		@JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm'Z'", timezone = "UTC")
		LocalDateTime updatedAt
) {
}