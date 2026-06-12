package ru.stopro.dto.chat;

import java.util.UUID;

/**
 * DTO для вложения в сообщение.
 */
public record AttachmentDto(
	UUID id,
	String fileUrl,
	String fileType,
	String fileName,
	Double fileSizeMb,
	Integer width,
	Integer height,
	Integer durationSec
) {
}

