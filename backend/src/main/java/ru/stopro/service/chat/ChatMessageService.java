package ru.stopro.service.chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Chat;
import ru.stopro.domain.entity.ChatMessage;
import ru.stopro.domain.entity.MessageAttachment;
import ru.stopro.domain.entity.MessageReadReceipt;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AttachmentType;
import ru.stopro.domain.enums.ChatMessageType;
import ru.stopro.dto.chat.AttachmentDto;
import ru.stopro.dto.chat.ChatMessageDto;
import ru.stopro.repository.UserRepository;
import ru.stopro.repository.chat.ChatMessageRepository;
import ru.stopro.repository.chat.ChatRepository;
import ru.stopro.repository.chat.MessageReadReceiptRepository;

/**
 * Сервис для управления сообщениями в чате.
 */
@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class ChatMessageService {

	private final ChatMessageRepository chatMessageRepository;
	private final ChatRepository chatRepository;
	private final UserRepository userRepository;
	private final MessageReadReceiptRepository messageReadReceiptRepository;

	/**
	 * Отправить текстовое сообщение в чат.
	 */
	@Transactional
	public ChatMessageDto sendMessage(UUID chatId, UUID senderId, String content) {
		if (content.length() > 4096) {
			throw new IllegalArgumentException("Сообщение не может быть длиннее 4096 символов");
		}

		Chat chat = chatRepository.findById(chatId)
			.orElseThrow(() -> new IllegalArgumentException("Chat not found"));

		User sender = userRepository.findById(senderId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

		ChatMessage message = ChatMessage.builder()
			.chat(chat)
			.sender(sender)
			.messageType(ChatMessageType.TEXT)
			.content(content)
			.contentPlain(content)
			.build();

		ChatMessage savedMessage = chatMessageRepository.save(message);

		chat.setLastMessageAt(LocalDateTime.now());
		chatRepository.save(chat);

		log.info("Message sent to chat {} by user {}", chatId, senderId);
		return convertToDto(savedMessage, senderId);
	}

	/**
	 * Редактировать сообщение.
	 */
	@Transactional
	public ChatMessageDto editMessage(UUID messageId, UUID editorId, String newContent) {
		if (newContent.length() > 4096) {
			throw new IllegalArgumentException("Сообщение не может быть длиннее 4096 символов");
		}

		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		if (!message.getSender().getId().equals(editorId)) {
			User editor = userRepository.findById(editorId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));
			if (!"TEACHER".equals(editor.getRole().name()) && !"ADMIN".equals(editor.getRole().name())) {
				throw new IllegalArgumentException("You can only edit your own messages");
			}
		}

		message.setContent(newContent);
		message.setContentPlain(newContent);
		message.setIsEdited(true);
		message.setEditedAt(LocalDateTime.now());

		ChatMessage updatedMessage = chatMessageRepository.save(message);

		log.info("Message {} edited by user {}", messageId, editorId);
		return convertToDto(updatedMessage, editorId);
	}

	/**
	 * Удалить сообщение.
	 */
	@Transactional
	public void deleteMessage(UUID messageId, UUID deleterId) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		if (!message.getSender().getId().equals(deleterId)) {
			User deleter = userRepository.findById(deleterId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));
			if (!"TEACHER".equals(deleter.getRole().name()) && !"ADMIN".equals(deleter.getRole().name())) {
				throw new IllegalArgumentException("You can only delete your own messages");
			}
		}

		message.setIsDeleted(true);
		chatMessageRepository.save(message);

		log.info("Message {} deleted by user {}", messageId, deleterId);
	}

	/**
	 * Закрепить сообщение (только для учителя).
	 */
	@Transactional
	public ChatMessageDto pinMessage(UUID messageId, UUID teacherId) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		User teacher = userRepository.findById(teacherId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (!"TEACHER".equals(teacher.getRole().name()) && !"ADMIN".equals(teacher.getRole().name())) {
			throw new IllegalArgumentException("Only teachers can pin messages");
		}

		message.setPinnedBy(teacher);
		message.setPinnedAt(LocalDateTime.now());

		ChatMessage updatedMessage = chatMessageRepository.save(message);

		createSystemMessage(message.getChat().getId(), "Сообщение закреплено");

		log.info("Message {} pinned by teacher {}", messageId, teacherId);
		return convertToDto(updatedMessage, teacherId);
	}

	/**
	 * Открепить сообщение.
	 */
	@Transactional
	public void unpinMessage(UUID messageId, UUID teacherId) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		User teacher = userRepository.findById(teacherId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (!"TEACHER".equals(teacher.getRole().name()) && !"ADMIN".equals(teacher.getRole().name())) {
			throw new IllegalArgumentException("Only teachers can unpin messages");
		}

		message.setPinnedBy(null);
		message.setPinnedAt(null);

		chatMessageRepository.save(message);

		createSystemMessage(message.getChat().getId(), "Сообщение откреплено");

		log.info("Message {} unpinned by teacher {}", messageId, teacherId);
	}

	/**
	 * Пометить сообщение как прочитанное пользователем.
	 */
	@Transactional
	public void markMessageAsRead(UUID messageId, UUID userId) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		User user = userRepository.findById(userId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (messageReadReceiptRepository.isMessageReadByUser(messageId, userId)) {
			return;
		}

		MessageReadReceipt readReceipt = MessageReadReceipt.builder()
			.message(message)
			.user(user)
			.readAt(LocalDateTime.now())
			.build();

		messageReadReceiptRepository.save(readReceipt);
		log.debug("Message {} marked as read by user {}", messageId, userId);
	}

	/**
	 * Добавить вложение к сообщению.
	 */
	@Transactional
	public void addAttachment(UUID messageId, String fileUrl, String fileType, String fileName, Double fileSizeMb) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		AttachmentType type = AttachmentType.valueOf(fileType.toUpperCase());

		MessageAttachment attachment = MessageAttachment.builder()
			.message(message)
			.fileUrl(fileUrl)
			.fileType(type)
			.fileName(fileName)
			.fileSizeMb(fileSizeMb)
			.build();

		message.getAttachments().add(attachment);
		chatMessageRepository.save(message);

		log.debug("Attachment added to message {}", messageId);
	}

	/**
	 * Создать системное сообщение.
	 */
	@Transactional
	public void createSystemMessage(UUID chatId, String content) {
		Chat chat = chatRepository.findById(chatId)
			.orElseThrow(() -> new IllegalArgumentException("Chat not found"));

		User teacher = chat.getTeacher();

		ChatMessage systemMessage = ChatMessage.builder()
			.chat(chat)
			.sender(teacher)
			.messageType(ChatMessageType.SYSTEM)
			.content(content)
			.contentPlain(content)
			.build();

		chatMessageRepository.save(systemMessage);

		chat.setLastMessageAt(LocalDateTime.now());
		chatRepository.save(chat);

		log.debug("System message created in chat {}: {}", chatId, content);
	}

	/**
	 * Получить список пользователей, которые прочитали сообщение.
	 */
	@Transactional(readOnly = true)
	public List<UUID> getMessageReadByUsers(UUID messageId) {
		List<MessageReadReceipt> readReceipts = messageReadReceiptRepository.findByMessageId(messageId);
		return readReceipts.stream()
			.map(r -> r.getUser().getId())
			.collect(Collectors.toList());
	}

	/**
	 * Конвертировать ChatMessage в ChatMessageDto.
	 */
	private ChatMessageDto convertToDto(ChatMessage message, UUID currentUserId) {
		List<AttachmentDto> attachments = message.getAttachments().stream()
			.map(a -> new AttachmentDto(
				a.getId(),
				a.getFileUrl(),
				a.getFileType().name(),
				a.getFileName(),
				a.getFileSizeMb(),
				a.getWidth(),
				a.getHeight(),
				a.getDurationSec()
			))
			.collect(Collectors.toList());

		List<UUID> readByUserIds = message.getReadReceipts().stream()
			.map(r -> r.getUser().getId())
			.collect(Collectors.toList());

		boolean isReadByCurrentUser = readByUserIds.contains(currentUserId);

		return new ChatMessageDto(
			message.getId(),
			message.getChat().getId(),
			message.getSender().getId(),
			message.getSender().getFullName(),
			message.getMessageType().name(),
			message.getContent(),
			attachments,
			message.getIsEdited(),
			message.getEditedAt(),
			message.isPinned(),
			message.getPinnedAt(),
			message.getPinnedBy() != null ? message.getPinnedBy().getId() : null,
			message.getReadCount(),
			isReadByCurrentUser,
			readByUserIds,
			message.getCreatedAt(),
			message.getUpdatedAt()
		);
	}
}

