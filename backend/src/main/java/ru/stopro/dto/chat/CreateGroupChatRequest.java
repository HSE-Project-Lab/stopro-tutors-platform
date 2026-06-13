package ru.stopro.dto.chat;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateGroupChatRequest(
		@NotBlank(message = "Название группы не может быть пустым")
		@Size(min = 1, max = 255, message = "Название группы должно содержать от 1 до 255 символов")
		String chatName,

		String chatAvatarUrl,

		List<UUID> studentIds,

		UUID existingGroupId
) {
}