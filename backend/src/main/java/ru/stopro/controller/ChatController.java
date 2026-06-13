package ru.stopro.controller;

import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import jakarta.validation.Valid;

import ru.stopro.domain.entity.Chat;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AttachmentType;
import ru.stopro.dto.chat.*;
import ru.stopro.repository.UserRepository;
import ru.stopro.service.chat.ChatMessageService;
import ru.stopro.service.chat.ChatService;

/**
 * REST контроллер для управления чатами.
 *
 * Endpoints:
 * - POST /api/v1/chats/personal/{studentId} - получить или создать личный чат
 * - GET /api/v1/chats/personal - получить все личные чаты (для учителя)
 * - GET /api/v1/chats/groups - получить все групповые чаты (для учителя)
 * - GET /api/v1/chats - получить все доступные чаты (для ученика)
 * - POST /api/v1/chats/groups - создать групповой чат
 * - PUT /api/v1/chats/groups/{chatId} - обновить информацию о групповом чате
 * - DELETE /api/v1/chats/groups/{chatId} - удалить групповой чат
 * - POST /api/v1/chats/{chatId}/students/{studentId} - добавить ученика в групповой чат
 * - DELETE /api/v1/chats/{chatId}/students/{studentId} - удалить ученика из группового чата
 * - GET /api/v1/chats/{chatId}/messages - получить историю сообщений
 * - GET /api/v1/chats/{chatId}/messages/search - поиск сообщений
 * - GET /api/v1/chats/{chatId}/pinned-messages - получить закрепленные сообщения
 * - POST /api/v1/chats/{chatId}/mark-read - пометить сообщения как прочитанные
 */
@RestController
@RequestMapping("/api/v1/chats")
@Slf4j
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class ChatController {

	private static final long MAX_ATTACHMENT_BYTES = 10L * 1024 * 1024;

	private final ChatService chatService;
	private final ChatMessageService chatMessageService;
	private final UserRepository userRepository;
	private final SimpMessagingTemplate messagingTemplate;

	/**
	 * Получить или создать личный чат между текущим учителем и студентом.
	 */
	@PostMapping("/personal/{studentId}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<ChatDto> getOrCreatePersonalChat(
		@PathVariable UUID studentId,
		Authentication authentication) {

		UUID teacherId = extractUserIdFromAuth(authentication);
		Chat chat = chatService.getOrCreatePersonalChat(teacherId, studentId);

		ChatDto dto = new ChatDto(
			chat.getId(),
			chat.getChatType().name(),
			chat.getTeacher().getId(),
			chat.getChatName(),
			chat.getChatAvatarUrl(),
			chat.getStatus().name(),
			chat.getLastMessageAt(),
			0,
			chat.getCreatedAt(),
			chat.getUpdatedAt()
		);

		return ResponseEntity.ok(dto);
	}

	/**
	 * Получить все личные чаты преподавателя.
	 */
	@GetMapping("/personal")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<List<PersonalChatDto>> getPersonalChats(Authentication authentication) {
		UUID teacherId = extractUserIdFromAuth(authentication);
		List<PersonalChatDto> chats = chatService.getTeacherPersonalChats(teacherId);
		return ResponseEntity.ok(chats);
	}

	/**
	 * Получить все групповые чаты преподавателя.
	 */
	@GetMapping("/groups")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<List<GroupChatDto>> getGroupChats(Authentication authentication) {
		UUID teacherId = extractUserIdFromAuth(authentication);
		List<GroupChatDto> chats = chatService.getTeacherGroupChats(teacherId);
		return ResponseEntity.ok(chats);
	}

	/**
	 * Получить все доступные чаты текущего пользователя (для студентов).
	 */
	@GetMapping
	@PreAuthorize("hasRole('STUDENT')")
	public ResponseEntity<List<Object>> getMyChats(Authentication authentication) {
		UUID userId = extractUserIdFromAuth(authentication);
		List<Object> chats = chatService.getStudentChats(userId);
		return ResponseEntity.ok(chats);
	}

	@PutMapping("/groups/{chatId}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Void> updateGroupChat(
		@PathVariable UUID chatId,
		@Valid @RequestBody UpdateGroupChatRequest request,
		Authentication authentication) {

		UUID teacherId = extractUserIdFromAuth(authentication);
		chatService.updateGroupChatName(chatId, teacherId, request);
		return ResponseEntity.ok().build();
	}

	/**
	 * Удалить групповой чат вместе со связанной учебной группой.
	 */
	@DeleteMapping("/groups/{chatId}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Void> deleteGroupChat(
		@PathVariable UUID chatId,
		Authentication authentication) {

		UUID teacherId = extractUserIdFromAuth(authentication);
		chatService.deleteGroupChat(chatId, teacherId);
		return ResponseEntity.ok().build();
	}

	/**
	 * Добавить студента в групповой чат.
	 */
	@PostMapping("/{chatId}/students/{studentId}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Void> addStudentToGroupChat(
		@PathVariable UUID chatId,
		@PathVariable UUID studentId,
		Authentication authentication) {

		UUID teacherId = extractUserIdFromAuth(authentication);
		chatService.addStudentToGroupChat(chatId, studentId, teacherId);
		return ResponseEntity.ok().build();
	}

	/**
	 * Удалить студента из группового чата.
	 */
	@DeleteMapping("/{chatId}/students/{studentId}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Void> removeStudentFromGroupChat(
		@PathVariable UUID chatId,
		@PathVariable UUID studentId,
		Authentication authentication) {

		UUID teacherId = extractUserIdFromAuth(authentication);
		chatService.removeStudentFromGroupChat(chatId, studentId, teacherId);
		return ResponseEntity.ok().build();
	}

	/**
	 * Отправить сообщение с вложением (файл размером до 10 МБ).
	 */
	@PostMapping(value = "/{chatId}/messages/attachment", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ChatMessageDto> sendAttachment(
		@PathVariable UUID chatId,
		@RequestParam("file") MultipartFile file,
		@RequestParam(value = "content", required = false) String content,
		@RequestParam(value = "replyToId", required = false) UUID replyToId,
		Authentication authentication) {

		UUID senderId = extractUserIdFromAuth(authentication);
		chatService.requireChatAccess(chatId, senderId);

		if (file == null || file.isEmpty()) {
			return ResponseEntity.badRequest().build();
		}
		if (file.getSize() > MAX_ATTACHMENT_BYTES) {
			return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).build();
		}

		try {
			String fileUrl = storeAttachment(file);
			AttachmentType type = resolveAttachmentType(file.getContentType());
			String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
			Double sizeMb = Math.round(file.getSize() / 1024.0 / 1024.0 * 100.0) / 100.0;

			ChatMessageDto dto = chatMessageService.sendMessageWithAttachment(
				chatId, senderId, content, replyToId, fileUrl, type, fileName, sizeMb);

			messagingTemplate.convertAndSend("/topic/chat/" + chatId, ChatEvent.sent(dto));
			return ResponseEntity.ok(dto);
		} catch (IOException e) {
			log.error("Ошибка при сохранении вложения", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	private String storeAttachment(MultipartFile file) throws IOException {
		Path uploadDir = Paths.get("uploads").toAbsolutePath().normalize();
		if (!Files.exists(uploadDir)) {
			Files.createDirectories(uploadDir);
		}
		String original = file.getOriginalFilename();
		String extension = "";
		if (original != null && original.contains(".")) {
			extension = original.substring(original.lastIndexOf("."));
		}
		String newName = UUID.randomUUID() + extension;
		Path target = uploadDir.resolve(newName);
		file.transferTo(target.toFile());
		return "/api/v1/uploads/" + newName;
	}

	private AttachmentType resolveAttachmentType(String contentType) {
		if (contentType == null) {
			return AttachmentType.FILE;
		}
		if (contentType.startsWith("image/")) {
			return AttachmentType.IMAGE;
		}
		if (contentType.startsWith("video/")) {
			return AttachmentType.VIDEO;
		}
		return AttachmentType.FILE;
	}

	/**
	 * Получить историю сообщений в чате.
	 */
	@GetMapping("/{chatId}/messages")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<Page<ChatMessageDto>> getChatHistory(
		@PathVariable UUID chatId,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "50") int pageSize,
		Authentication authentication) {

		UUID userId = extractUserIdFromAuth(authentication);
		chatService.requireChatAccess(chatId, userId);
		Page<ChatMessageDto> messages = chatService.getChatHistory(chatId, page, pageSize);
		return ResponseEntity.ok(messages);
	}

	/**
	 * Поиск сообщений в чате.
	 */
	@GetMapping("/{chatId}/messages/search")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<Page<ChatMessageDto>> searchMessages(
		@PathVariable UUID chatId,
		@RequestParam String query,
		@RequestParam(defaultValue = "0") int page,
		@RequestParam(defaultValue = "20") int pageSize,
		Authentication authentication) {

		UUID userId = extractUserIdFromAuth(authentication);
		chatService.requireChatAccess(chatId, userId);
		Page<ChatMessageDto> results = chatService.searchMessages(chatId, query, page, pageSize);
		return ResponseEntity.ok(results);
	}

	/**
	 * Получить закрепленные сообщения в чате.
	 */
	@GetMapping("/{chatId}/pinned-messages")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<List<ChatMessageDto>> getPinnedMessages(
		@PathVariable UUID chatId,
		Authentication authentication) {

		UUID userId = extractUserIdFromAuth(authentication);
		chatService.requireChatAccess(chatId, userId);
		List<ChatMessageDto> pinnedMessages = chatService.getPinnedMessages(chatId);
		return ResponseEntity.ok(pinnedMessages);
	}

	/**
	 * Пометить сообщения как прочитанные.
	 */
	@PostMapping("/{chatId}/mark-read")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<Void> markMessagesAsRead(
		@PathVariable UUID chatId,
		Authentication authentication) {

		UUID userId = extractUserIdFromAuth(authentication);
		chatService.requireChatAccess(chatId, userId);
		chatService.markMessagesAsRead(chatId, userId);
		return ResponseEntity.ok().build();
	}

	/**
	 * Получить количество непрочитанных сообщений в чате.
	 */
	@GetMapping("/{chatId}/unread-count")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<Integer> getUnreadCount(
		@PathVariable UUID chatId,
		Authentication authentication) {

		UUID userId = extractUserIdFromAuth(authentication);
		chatService.requireChatAccess(chatId, userId);
		Integer unreadCount = chatService.countUnreadMessages(chatId, userId);
		return ResponseEntity.ok(unreadCount);
	}

	/**
	 * Получить список «кто и когда прочитал» сообщение.
	 */
	@GetMapping("/messages/{messageId}/read-by")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<List<MessageReadInfoDto>> getMessageReadBy(
		@PathVariable UUID messageId,
		Authentication authentication) {

		UUID userId = extractUserIdFromAuth(authentication);
		List<MessageReadInfoDto> readBy = chatMessageService.getMessageReadInfo(messageId, userId);
		return ResponseEntity.ok(readBy);
	}

	/**
	 * Вспомогательный метод для извлечения ID пользователя из Authentication.
	 */
	private UUID extractUserIdFromAuth(Authentication authentication) {
		if (authentication != null && authentication.getPrincipal() instanceof User) {
			return ((User) authentication.getPrincipal()).getId();
		}

		String username = authentication != null ? authentication.getName() : null;
		if (username != null) {
			return userRepository.findByUsername(username)
				.map(User::getId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));
		}

		throw new IllegalArgumentException("Could not extract user ID from authentication");
	}
}

