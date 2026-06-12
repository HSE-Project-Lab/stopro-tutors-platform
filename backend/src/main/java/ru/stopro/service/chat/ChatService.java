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

	@Transactional
	public Chat getOrCreatePersonalChat(UUID teacherId, UUID studentId) {
		User teacher = userRepository.findById(teacherId)
				.orElseThrow(() -> new IllegalArgumentException("Teacher not found"));
		User student = userRepository.findById(studentId)
				.orElseThrow(() -> new IllegalArgumentException("Student not found"));

		Optional<PersonalChat> existingChat = personalChatRepository.findByTeacherAndStudent(teacherId, studentId);
		if (existingChat.isPresent()) {
			return existingChat.get();
		}

		PersonalChat personalChat = new PersonalChat();
		personalChat.setChatType(ChatType.PERSONAL);
		personalChat.setTeacher(teacher);
		personalChat.setStudent(student);
		personalChat.setStatus(ChatStatus.ACTIVE);

		Chat savedChat = chatRepository.save(personalChat);
		addParticipant(savedChat.getId(), teacherId);
		addParticipant(savedChat.getId(), studentId);
		chatMessageService.createSystemMessage(savedChat.getId(), "Чат создан");
		log.info("Personal chat created between teacher {} and student {}", teacherId, studentId);
		return savedChat;
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

		chat.setStatus(ChatStatus.PENDING_DELETION);
		chatRepository.save(chat);
		log.info("Group chat {} marked for deletion", chatId);
	}

	@Transactional
	public void addParticipant(UUID chatId, UUID userId) {
		Chat chat = chatRepository.findById(chatId)
				.orElseThrow(() -> new IllegalArgumentException("Chat not found"));
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new IllegalArgumentException("User not found"));

		Optional<ChatParticipant> existing = chatParticipantRepository.findByChatAndUser(chatId, userId);
		if (existing.isPresent() && existing.get().getLeftAt() == null) {
			return;
		}

		ChatParticipant participant = ChatParticipant.builder()
				.chat(chat)
				.user(user)
				.joinedAt(LocalDateTime.now())
				.build();
		chatParticipantRepository.save(participant);
		log.debug("User {} added as participant to chat {}", userId, chatId);
	}

	@Transactional(readOnly = true)
	public List<PersonalChatDto> getTeacherPersonalChats(UUID teacherId) {
		List<Chat> chats = chatRepository.findByTeacherIdAndStatus(teacherId, ChatStatus.ACTIVE);
		return chats.stream()
				.filter(c -> c.getChatType() == ChatType.PERSONAL)
				.map(chat -> {
					PersonalChat pc = (PersonalChat) chat;
					Integer unreadCount = countUnreadMessages(chat.getId(), teacherId);
					return new PersonalChatDto(
							chat.getId(),
							pc.getStudent().getId(),
							pc.getStudent().getFullName(),
							null,
							chat.getLastMessageAt(),
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
				.map(gc -> {
					Integer unreadCount = countUnreadMessages(gc.getId(), teacherId);
					return new GroupChatDto(
							gc.getId(),
							gc.getChatName(),
							gc.getChatAvatarUrl(),
							gc.getStudyGroup().getId(),
							gc.getStudyGroup().getStudentsCount(),
							gc.getLastMessageAt(),
							unreadCount,
							gc.getCreatedAt()
					);
				})
				.collect(Collectors.toList());
	}

	@Transactional(readOnly = true)
	public List<ChatDto> getStudentChats(UUID studentId) {
		List<UUID> chatIds = chatParticipantRepository.findChatsForUser(studentId);
		return chatIds.stream()
				.map(chatId -> chatRepository.findById(chatId).orElse(null))
				.filter(c -> c != null && c.getStatus() == ChatStatus.ACTIVE)
				.map(chat -> {
					Integer unreadCount = countUnreadMessages(chat.getId(), studentId);
					return new ChatDto(
							chat.getId(),
							chat.getChatType().name(),
							chat.getTeacher().getId(),
							chat.getChatName(),
							chat.getChatAvatarUrl(),
							chat.getStatus().name(),
							chat.getLastMessageAt(),
							unreadCount,
							chat.getCreatedAt(),
							chat.getUpdatedAt()
					);
				})
				.collect(Collectors.toList());
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
				message.getCreatedAt(),
				message.getUpdatedAt()
		);
	}
}