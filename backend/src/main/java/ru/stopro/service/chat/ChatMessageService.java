package ru.stopro.service.chat;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;

import ru.stopro.domain.entity.Chat;
import ru.stopro.domain.entity.ChatMessage;
import ru.stopro.domain.entity.MessageAttachment;
import ru.stopro.domain.entity.MessageReadReceipt;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AttachmentType;
import ru.stopro.domain.enums.ChatMessageType;
import ru.stopro.domain.enums.ChatStatus;
import ru.stopro.dto.chat.AttachmentDto;
import ru.stopro.dto.chat.ChatMessageDto;
import ru.stopro.dto.chat.MessageReadInfoDto;
import ru.stopro.repository.UserRepository;
import ru.stopro.repository.chat.ChatInactivityWarningRepository;
import ru.stopro.repository.chat.ChatMessageRepository;
import ru.stopro.repository.chat.ChatParticipantRepository;
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
	private final ChatParticipantRepository chatParticipantRepository;
	private final UserRepository userRepository;
	private final MessageReadReceiptRepository messageReadReceiptRepository;
	private final ChatInactivityWarningRepository chatInactivityWarningRepository;

	/**
	 * Отправить текстовое сообщение в чат.
	 */
	@Transactional
	public ChatMessageDto sendMessage(UUID chatId, UUID senderId, String content, UUID replyToId) {
		if (content == null || content.isBlank()) {
			throw new IllegalArgumentException("Сообщение не может быть пустым");
		}
		if (content.length() > 4096) {
			throw new IllegalArgumentException("Сообщение не может быть длиннее 4096 символов");
		}
		if (!chatParticipantRepository.isUserInChat(chatId, senderId)) {
			throw new IllegalArgumentException("Пользователь не является участником чата");
		}

		Chat chat = chatRepository.findById(chatId)
			.orElseThrow(() -> new IllegalArgumentException("Chat not found"));

		User sender = userRepository.findById(senderId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

		ChatMessage replyTo = null;
		if (replyToId != null) {
			replyTo = chatMessageRepository.findById(replyToId)
				.filter(m -> m.getChat().getId().equals(chatId))
				.orElse(null);
		}

		ChatMessage message = ChatMessage.builder()
			.chat(chat)
			.sender(sender)
			.messageType(ChatMessageType.TEXT)
			.content(content)
			.contentPlain(content)
			.replyTo(replyTo)
			.build();

		ChatMessage savedMessage = chatMessageRepository.save(message);

		chat.setLastMessageAt(LocalDateTime.now());

		if (chat.getStatus() == ChatStatus.PENDING_DELETION) {
			chatInactivityWarningRepository
				.findLatestActiveWarning(chatId, PageRequest.of(0, 1))
				.forEach(w -> w.setWarningDismissed(true));
			chat.setStatus(ChatStatus.ACTIVE);
			log.info("Chat {} restored to ACTIVE after message from user {}", chatId, senderId);
		}

		chatRepository.save(chat);

		log.info("Message sent to chat {} by user {}", chatId, senderId);
		return convertToDto(savedMessage, senderId);
	}

	/**
	 * Редактировать сообщение.
	 */
	@Transactional
	public ChatMessageDto editMessage(UUID messageId, UUID editorId, String newContent) {
		if (newContent == null || newContent.isBlank()) {
			throw new IllegalArgumentException("Сообщение не может быть пустым");
		}
		if (newContent.length() > 4096) {
			throw new IllegalArgumentException("Сообщение не может быть длиннее 4096 символов");
		}

		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		if (!message.getSender().getId().equals(editorId)) {
			throw new IllegalArgumentException("Редактировать можно только свои сообщения");
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

		boolean isOwnMessage = message.getSender().getId().equals(deleterId);
		boolean isChatOwner = message.getChat().getTeacher().getId().equals(deleterId);
		if (!isOwnMessage && !isChatOwner) {
			throw new IllegalArgumentException("Недостаточно прав для удаления сообщения");
		}

		message.setIsDeleted(true);
		chatMessageRepository.save(message);

		log.info("Message {} deleted by user {}", messageId, deleterId);
	}

	/**
	 * Закрепить сообщение (только для учителя-владельца чата).
	 */
	@Transactional
	public ChatMessageDto pinMessage(UUID messageId, UUID teacherId) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		User teacher = userRepository.findById(teacherId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (!"TEACHER".equals(teacher.getRole().name()) && !"ADMIN".equals(teacher.getRole().name())) {
			throw new IllegalArgumentException("Закреплять сообщения может только учитель");
		}
		if (!message.getChat().getTeacher().getId().equals(teacherId)) {
			throw new IllegalArgumentException("Недостаточно прав для закрепления в этом чате");
		}

		message.setPinnedBy(teacher);
		message.setPinnedAt(LocalDateTime.now());

		ChatMessage updatedMessage = chatMessageRepository.save(message);

		createSystemMessage(message.getChat().getId(), "Сообщение закреплено");

		log.info("Message {} pinned by teacher {}", messageId, teacherId);
		return convertToDto(updatedMessage, teacherId);
	}

	/**
	 * Открепить сообщение (только для учителя-владельца чата).
	 */
	@Transactional
	public ChatMessageDto unpinMessage(UUID messageId, UUID teacherId) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));

		User teacher = userRepository.findById(teacherId)
			.orElseThrow(() -> new IllegalArgumentException("User not found"));

		if (!"TEACHER".equals(teacher.getRole().name()) && !"ADMIN".equals(teacher.getRole().name())) {
			throw new IllegalArgumentException("Откреплять сообщения может только учитель");
		}
		if (!message.getChat().getTeacher().getId().equals(teacherId)) {
			throw new IllegalArgumentException("Недостаточно прав для открепления в этом чате");
		}

		message.setPinnedBy(null);
		message.setPinnedAt(null);

		ChatMessage updatedMessage = chatMessageRepository.save(message);

		createSystemMessage(message.getChat().getId(), "Сообщение откреплено");

		log.info("Message {} unpinned by teacher {}", messageId, teacherId);
		return convertToDto(updatedMessage, teacherId);
	}

	/**
	 * Пометить сообщение как прочитанное пользователем.
	 *
	 * @return время прочтения, если квитанция создана; {@code null}, если помечать нечего
	 *         (своё сообщение, нет доступа или уже прочитано)
	 */
	@Transactional
	public LocalDateTime markMessageAsRead(UUID messageId, UUID userId) {
		ChatMessage message = chatMessageRepository.findById(messageId).orElse(null);
		if (message == null) {
			return null;
		}
		if (message.getSender().getId().equals(userId)) {
			return null;
		}
		if (!chatParticipantRepository.isUserInChat(message.getChat().getId(), userId)) {
			return null;
		}
		if (messageReadReceiptRepository.isMessageReadByUser(messageId, userId)) {
			return null;
		}

		User user = userRepository.findById(userId).orElse(null);
		if (user == null) {
			return null;
		}

		LocalDateTime readAt = LocalDateTime.now();
		MessageReadReceipt readReceipt = MessageReadReceipt.builder()
			.message(message)
			.user(user)
			.readAt(readAt)
			.build();

		messageReadReceiptRepository.save(readReceipt);
		log.debug("Message {} marked as read by user {}", messageId, userId);
		return readAt;
	}

	/**
	 * Получить список «кто и когда прочитал» сообщение (с проверкой доступа запрашивающего).
	 */
	@Transactional(readOnly = true)
	public List<MessageReadInfoDto> getMessageReadInfo(UUID messageId, UUID requesterId) {
		ChatMessage message = chatMessageRepository.findById(messageId)
			.orElseThrow(() -> new IllegalArgumentException("Message not found"));
		if (!chatParticipantRepository.isUserInChat(message.getChat().getId(), requesterId)) {
			throw new IllegalArgumentException("Нет доступа к данному чату");
		}
		return messageReadReceiptRepository.findByMessageId(messageId).stream()
			.map(r -> new MessageReadInfoDto(r.getUser().getId(), r.getUser().getFullName(), r.getReadAt()))
			.sorted(Comparator.comparing(MessageReadInfoDto::readAt))
			.collect(Collectors.toList());
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
	 * Короткое превью сообщения для отображения цитаты ответа.
	 */
	static String previewOf(ChatMessage message) {
		if (Boolean.TRUE.equals(message.getIsDeleted())) {
			return "Сообщение удалено";
		}
		String source = message.getContentPlain() != null ? message.getContentPlain() : message.getContent();
		if (source == null) {
			return "";
		}
		source = source.strip();
		return source.length() > 120 ? source.substring(0, 120) + "…" : source;
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
			message.getReplyTo() != null ? message.getReplyTo().getId() : null,
			message.getReplyTo() != null ? message.getReplyTo().getSender().getId() : null,
			message.getReplyTo() != null ? message.getReplyTo().getSender().getFullName() : null,
			message.getReplyTo() != null ? previewOf(message.getReplyTo()) : null,
			message.getCreatedAt(),
			message.getUpdatedAt()
		);
	}
}

