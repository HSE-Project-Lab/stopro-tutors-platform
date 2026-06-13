package ru.stopro.service.chat;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.*;
import ru.stopro.domain.enums.ChatMessageType;
import ru.stopro.domain.enums.ChatStatus;
import ru.stopro.domain.enums.ChatType;
import ru.stopro.dto.chat.*;
import ru.stopro.repository.StudyGroupRepository;
import ru.stopro.repository.UserRepository;
import ru.stopro.repository.chat.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@Transactional
@Slf4j
@RequiredArgsConstructor
public class ChatService {

	private final ChatRepository chatRepository;
	private final PersonalChatRepository personalChatRepository;
	private final GroupChatRepository groupChatRepository;
	private final ChatParticipantRepository chatParticipantRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final UserRepository userRepository;
	private final StudyGroupRepository studyGroupRepository;
	private final ChatMessageService chatMessageService;
	private final SimpMessagingTemplate messagingTemplate;

	@Transactional
	public Chat getOrCreatePersonalChat(UUID teacherId, UUID studentId) {
		User teacher = userRepository.findById(teacherId)
				.orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
		User student = userRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));

		Optional<PersonalChat> existingChat = personalChatRepository.findByTeacherAndStudent(teacherId, studentId);
		Chat chat;
		boolean isNewChat = false;
		if (existingChat.isPresent()) {
			chat = existingChat.get();
			log.info("Personal chat already exists between teacher {} and student {}, ID: {}", teacherId, studentId, chat.getId());
		} else {
			PersonalChat personalChat = new PersonalChat();
			personalChat.setChatType(ChatType.PERSONAL);
			personalChat.setTeacher(teacher);
			personalChat.setStudent(student);
			personalChat.setStatus(ChatStatus.ACTIVE);

			chat = chatRepository.save(personalChat);
			chatMessageService.createSystemMessage(chat.getId(), "Чат создан");
			isNewChat = true;
			log.info("Personal chat created between teacher {} and student {}, ID: {}", teacherId, studentId, chat.getId());
		}

		addParticipant(chat.getId(), teacherId);
		addParticipant(chat.getId(), studentId);

		if (isNewChat) {
			notifyStudentOfNewChat(studentId, chat);
		}

		return chat;
	}

	@Transactional
	public Chat createGroupChat(UUID teacherId, CreateGroupChatRequest request) {
		User teacher = userRepository.findById(teacherId)
				.orElseThrow(() -> new IllegalArgumentException("Teacher not found"));

		Optional<Integer> maxGroupNumber = groupChatRepository.findMaxGroupNumber(teacherId);
		int nextGroupNumber = maxGroupNumber.map(n -> n + 1).orElse(1);

		StudyGroup studyGroup;
		if (request.existingGroupId() != null) {
			studyGroup = studyGroupRepository.findById(request.existingGroupId())
					.orElseThrow(() -> new IllegalArgumentException("Study group not found: " + request.existingGroupId()));
		} else {
			studyGroup = StudyGroup.builder()
					.name(request.chatName())
					.teacher(teacher)
					.inviteCode(UUID.randomUUID().toString().substring(0, 10))
					.build();
			studyGroup = studyGroupRepository.save(studyGroup);
		}

		GroupChat groupChat = new GroupChat();
		groupChat.setChatType(ChatType.GROUP);
		groupChat.setTeacher(teacher);
		groupChat.setChatName(request.chatName());
		groupChat.setChatAvatarUrl(request.chatAvatarUrl());
		groupChat.setStatus(ChatStatus.ACTIVE);
		groupChat.setStudyGroup(studyGroup);
		groupChat.setNextGroupNumber(nextGroupNumber);

		Chat savedChat = chatRepository.save(groupChat);
		addParticipant(savedChat.getId(), teacherId);

		if (request.studentIds() != null) {
			for (UUID studentId : request.studentIds()) {
				User student = userRepository.findById(studentId)
						.orElseThrow(() -> new IllegalArgumentException("Student not found: " + studentId));
				addParticipant(savedChat.getId(), studentId);
				studyGroup.getStudents().add(student);
				notifyStudentOfNewChat(studentId, savedChat);
			}
			studyGroupRepository.save(studyGroup);
		}

		chatMessageService.createSystemMessage(savedChat.getId(), "Преподаватель создал группу");
		log.info("Group chat created with ID: {} for teacher: {}, linked to study group: {}",
				savedChat.getId(), teacherId, studyGroup.getId());
		return savedChat;
	}

	@Transactional
	public void updateGroupChatName(UUID chatId, UUID teacherId, UpdateGroupChatRequest request) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Chat not found"));

		if (!chat.getTeacher().getId().equals(teacherId)) {
			throw new IllegalArgumentException("Only teacher can update group chat");
		}
		if (chat.getChatType() != ChatType.GROUP) {
			throw new IllegalArgumentException("Chat is not a group chat");
		}

		chat.setChatName(request.chatName());
		if (request.chatAvatarUrl() != null) {
			chat.setChatAvatarUrl(request.chatAvatarUrl());
		}
		chatRepository.save(chat);

		GroupChat groupChat = groupChatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Group chat not found"));
		groupChat.getStudyGroup().setName(request.chatName());
		studyGroupRepository.save(groupChat.getStudyGroup());

		chatMessageService.createSystemMessage(chatId, "Название группы изменено");
		log.info("Group chat {} name updated to: {}", chatId, request.chatName());
	}

	@Transactional
	public void addStudentToGroupChat(UUID chatId, UUID studentId, UUID teacherId) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Chat not found"));

		if (!chat.getTeacher().getId().equals(teacherId)) {
			throw new IllegalArgumentException("Only teacher can add students to group chat");
		}
		if (chat.getChatType() != ChatType.GROUP) {
			throw new IllegalArgumentException("Chat is not a group chat");
		}

		User student = userRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));

		addParticipant(chatId, studentId);

		GroupChat groupChat = groupChatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Group chat not found"));
		if (!groupChat.getStudyGroup().getStudents().contains(student)) {
			groupChat.getStudyGroup().getStudents().add(student);
			studyGroupRepository.save(groupChat.getStudyGroup());
		}

		chatMessageService.createSystemMessage(chatId, student.getFullName() + " добавлен в группу");
		notifyStudentOfNewChat(studentId, chat);
		log.info("Student {} added to group chat {}", studentId, chatId);
	}

	@Transactional
	public void removeStudentFromGroupChat(UUID chatId, UUID studentId, UUID teacherId) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Chat not found"));

		if (!chat.getTeacher().getId().equals(teacherId)) {
			throw new IllegalArgumentException("Only teacher can remove students from group chat");
		}
		if (chat.getChatType() != ChatType.GROUP) {
			throw new IllegalArgumentException("Chat is not a group chat");
		}

		User student = userRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));

		Optional<ChatParticipant> participant = chatParticipantRepository.findByChatAndUser(chatId, studentId);
		if (participant.isPresent()) {
			participant.get().setLeftAt(LocalDateTime.now());
			chatParticipantRepository.save(participant.get());
		}
		notifyChatRemoved(studentId, chatId, ChatType.GROUP);

		GroupChat groupChat = groupChatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Group chat not found"));
		groupChat.getStudyGroup().getStudents().remove(student);

		if (groupChat.getStudyGroup().getStudents().isEmpty()) {
			deleteGroupChat(chatId, teacherId);
			return;
		}

		studyGroupRepository.save(groupChat.getStudyGroup());
		chatMessageService.createSystemMessage(chatId, student.getFullName() + " удален из группы");
		log.info("Student {} removed from group chat {}", studentId, chatId);
	}

	/**
	 * Удаляет личный чат учителя с учеником вместе с сообщениями и участниками.
	 *
	 * @param teacherId идентификатор учителя-владельца чата
	 * @param studentId идентификатор ученика
	 */
	@Transactional
	public void deletePersonalChat(UUID teacherId, UUID studentId) {
		personalChatRepository.findByTeacherAndStudent(teacherId, studentId).ifPresent(chat -> {
			UUID chatId = chat.getId();
			chatRepository.delete(chat);
			chatRepository.flush();
			notifyChatRemoved(studentId, chatId, ChatType.PERSONAL);
			notifyChatRemoved(teacherId, chatId, ChatType.PERSONAL);
			log.info("Personal chat {} deleted for teacher {} and student {}", chatId, teacherId, studentId);
		});
	}

	@Transactional
	public void deleteGroupChat(UUID chatId, UUID teacherId) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Chat not found"));

		if (!chat.getTeacher().getId().equals(teacherId)) {
			throw new IllegalArgumentException("Only teacher can delete group chat");
		}
		if (chat.getChatType() != ChatType.GROUP) {
			throw new IllegalArgumentException("Chat is not a group chat");
		}

		GroupChat groupChat = (GroupChat) chat;
		StudyGroup studyGroup = groupChat.getStudyGroup();

		chatRepository.delete(chat);
		chatRepository.flush();

		if (studyGroup != null) {
			studyGroup.getStudents().clear();
			studyGroupRepository.saveAndFlush(studyGroup);
			studyGroupRepository.delete(studyGroup);
		}

		log.info("Group chat {} deleted by teacher {}", chatId, teacherId);
	}

	public void addParticipant(UUID chatId, UUID userId) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Chat not found"));
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		Optional<ChatParticipant> existing = chatParticipantRepository.findByChatAndUser(chatId, userId);
		if (existing.isPresent()) {
			if (existing.get().getLeftAt() == null) {
				log.debug("User {} already participant in chat {}", userId, chatId);
				return;
			}
			existing.get().setLeftAt(null);
			existing.get().setJoinedAt(LocalDateTime.now());
			chatParticipantRepository.save(existing.get());
			log.info("User {} re-joined chat {}", userId, chatId);
			return;
		}

		ChatParticipant participant = ChatParticipant.builder()
				.chat(chat)
				.user(user)
				.joinedAt(LocalDateTime.now())
				.build();
		chatParticipantRepository.save(participant);
		log.info("User {} added as participant to chat {}", userId, chatId);
	}

	@Transactional(readOnly = true)
	public List<PersonalChatDto> getTeacherPersonalChats(UUID teacherId) {
		List<Chat> chats = chatRepository.findByTeacherIdAndStatus(teacherId, ChatStatus.ACTIVE);
		return chats.stream()
				.filter(c -> c.getChatType() == ChatType.PERSONAL)
				.map(chat -> {
					PersonalChat pc = (PersonalChat) chat;
					Integer unreadCount = countUnreadMessages(chat.getId(), teacherId);
					LastMessageInfo lastMessage = lastMessageInfo(chat.getId());
					return new PersonalChatDto(
							chat.getId(),
							ChatType.PERSONAL.name(),
							pc.getStudent().getId(),
							pc.getStudent().getFullName(),
							null,
							chat.getLastMessageAt(),
							lastMessage.preview(),
							lastMessage.senderName(),
							lastMessage.senderId(),
							unreadCount,
							chat.getCreatedAt()
					);
				})
				.collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	public List<GroupChatDto> getTeacherGroupChats(UUID teacherId) {
		List<GroupChat> groupChats = groupChatRepository.findByTeacherId(teacherId);
		return groupChats.stream()
				.filter(gc -> gc.getStatus() == ChatStatus.ACTIVE)
				.map(gc -> {
					Integer unreadCount = countUnreadMessages(gc.getId(), teacherId);
					LastMessageInfo lastMessage = lastMessageInfo(gc.getId());
					return new GroupChatDto(
							gc.getId(),
							ChatType.GROUP.name(),
							gc.getChatName(),
							gc.getChatAvatarUrl(),
							gc.getStudyGroup().getId(),
							gc.getStudyGroup().getStudentsCount(),
							gc.getLastMessageAt(),
							lastMessage.preview(),
							lastMessage.senderName(),
							lastMessage.senderId(),
							unreadCount,
							gc.getCreatedAt()
					);
				})
				.collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	public List<Object> getStudentChats(UUID studentId) {
		List<UUID> chatIds = chatParticipantRepository.findChatsForUser(studentId);
		log.info("Found {} chats for student {}", chatIds.size(), studentId);

		List<Object> result = chatIds.stream()
				.map(chatId -> chatRepository.findById(chatId).orElse(null))
				.filter(c -> c != null && c.getStatus() == ChatStatus.ACTIVE)
				.map(chat -> {
					Integer unreadCount = countUnreadMessages(chat.getId(), studentId);
					LastMessageInfo lastMessage = lastMessageInfo(chat.getId());
					if (chat.getChatType() == ChatType.PERSONAL) {
						PersonalChat pc = (PersonalChat) chat;
						return (Object) new PersonalChatDto(
								chat.getId(),
								ChatType.PERSONAL.name(),
								chat.getTeacher().getId(),
								chat.getTeacher().getFullName(),
								null,
								chat.getLastMessageAt(),
								lastMessage.preview(),
								lastMessage.senderName(),
								lastMessage.senderId(),
								unreadCount,
								chat.getCreatedAt()
						);
					} else {
						GroupChat gc = (GroupChat) chat;
						return (Object) new GroupChatDto(
								chat.getId(),
								ChatType.GROUP.name(),
								chat.getChatName(),
								chat.getChatAvatarUrl(),
								gc.getStudyGroup().getId(),
								gc.getStudyGroup().getStudentsCount(),
								chat.getLastMessageAt(),
								lastMessage.preview(),
								lastMessage.senderName(),
								lastMessage.senderId(),
								unreadCount,
								chat.getCreatedAt()
						);
					}
				})
				.collect(Collectors.toList());

		log.info("Returning {} active chats for student {}", result.size(), studentId);
		return result;
	}

	/**
	 * Сведения о последнем сообщении чата для превью в списке чатов.
	 */
	private record LastMessageInfo(String preview, String senderName, UUID senderId) {
	}

	/**
	 * Возвращает превью последнего сообщения чата и данные его автора.
	 *
	 * @param chatId идентификатор чата
	 * @return превью, имя и идентификатор отправителя; поля null, если сообщений нет
	 */
	private LastMessageInfo lastMessageInfo(UUID chatId) {
		List<ChatMessage> latest = chatMessageRepository.findLatestMessage(chatId, PageRequest.of(0, 1));
		if (latest.isEmpty()) {
			return new LastMessageInfo(null, null, null);
		}
		ChatMessage message = latest.get(0);
		String preview = ChatMessageService.previewOf(message);
		if (message.getMessageType() == ChatMessageType.SYSTEM || message.getSender() == null) {
			return new LastMessageInfo(preview, null, null);
		}
		return new LastMessageInfo(preview, message.getSender().getFullName(), message.getSender().getId());
	}

	@Transactional(readOnly = true)
	public Integer countUnreadMessages(UUID chatId, UUID userId) {
		Optional<ChatParticipant> participant = chatParticipantRepository.findByChatAndUser(chatId, userId);
		if (participant.isEmpty() || participant.get().getLastReadAt() == null) {
			LocalDateTime joinDate = participant.map(ChatParticipant::getJoinedAt).orElse(LocalDateTime.now());
			return chatMessageRepository.countUnreadMessages(chatId, userId, joinDate);
		}
		return chatMessageRepository.countUnreadMessages(chatId, userId, participant.get().getLastReadAt());
	}

	@Transactional
	public void markMessagesAsRead(UUID chatId, UUID userId) {
		Optional<ChatParticipant> participant = chatParticipantRepository.findByChatAndUser(chatId, userId);
		if (participant.isPresent()) {
			participant.get().setLastReadAt(LocalDateTime.now());
			chatParticipantRepository.save(participant.get());
			log.debug("Messages marked as read for user {} in chat {}", userId, chatId);
		}
	}

	/**
	 * Проверить, что пользователь является активным участником чата.
	 *
	 * @throws IllegalArgumentException если пользователь не является участником
	 */
	public void requireChatAccess(UUID chatId, UUID userId) {
		if (!chatParticipantRepository.isUserInChat(chatId, userId)) {
			throw new IllegalArgumentException("Нет доступа к данному чату");
		}
	}

	@Transactional(readOnly = true)
	public Page<ChatMessageDto> getChatHistory(UUID chatId, int page, int pageSize) {
		Pageable pageable = PageRequest.of(page, pageSize);
		Page<ChatMessage> messages = chatMessageRepository.findByChatIdOrderByCreatedAtAsc(chatId, pageable);
		return messages.map(this::convertToDto);
	}

	@Transactional(readOnly = true)
	public Page<ChatMessageDto> searchMessages(UUID chatId, String query, int page, int pageSize) {
		Pageable pageable = PageRequest.of(page, pageSize);
		Page<ChatMessage> messages = chatMessageRepository.searchByContent(chatId, query, pageable);
		return messages.map(this::convertToDto);
	}

	@Transactional(readOnly = true)
	public List<ChatMessageDto> getPinnedMessages(UUID chatId) {
		List<ChatMessage> pinnedMessages = chatMessageRepository.findPinnedMessages(chatId);
		return pinnedMessages.stream()
				.map(this::convertToDto)
				.collect(Collectors.toList());
	}

	/**
	 * Уведомляет пользователя о том, что чат для него удалён, чтобы клиент убрал его из списка.
	 *
	 * @param userId   идентификатор получателя уведомления
	 * @param chatId   идентификатор удалённого чата
	 * @param chatType тип чата
	 */
	private void notifyChatRemoved(UUID userId, UUID chatId, ChatType chatType) {
		try {
			messagingTemplate.convertAndSend(
					"/topic/notifications/" + userId,
					new ChatNotificationDto(
							"chat_removed",
							chatId.toString(),
							chatType.name(),
							"Чат удалён"
					)
			);
		} catch (Exception e) {
			log.error("Failed to send chat_removed notification to user {}: {}", userId, e.getMessage());
		}
	}

	private void notifyStudentOfNewChat(UUID studentId, Chat chat) {
		try {
			log.info("Sending new chat notification to student {}", studentId);
			messagingTemplate.convertAndSend(
					"/topic/notifications/" + studentId,
					new ChatNotificationDto(
							"new_chat",
							chat.getId().toString(),
							chat.getChatType().name(),
							"Новый чат создан"
					)
			);
			log.info("New chat notification sent to student {}", studentId);
		} catch (Exception e) {
			log.error("Failed to send chat notification to student {}: {}", studentId, e.getMessage());
		}
	}

	public static class ChatNotificationDto {
		public String type;
		public String chatId;
		public String chatType;
		public String message;

		public ChatNotificationDto(String type, String chatId, String chatType, String message) {
			this.type = type;
			this.chatId = chatId;
			this.chatType = chatType;
			this.message = message;
		}
	}

	private ChatMessageDto convertToDto(ChatMessage message) {
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
				false,
				readByUserIds,
				message.getReplyTo() != null ? message.getReplyTo().getId() : null,
				message.getReplyTo() != null ? message.getReplyTo().getSender().getId() : null,
				message.getReplyTo() != null ? message.getReplyTo().getSender().getFullName() : null,
				message.getReplyTo() != null ? ChatMessageService.previewOf(message.getReplyTo()) : null,
				message.getCreatedAt(),
				message.getUpdatedAt()
		);
	}
}