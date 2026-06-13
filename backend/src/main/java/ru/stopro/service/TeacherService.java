package ru.stopro.service;

import java.security.SecureRandom;
import java.util.*;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.GroupChat;
import ru.stopro.domain.entity.StudyGroup;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.UserRole;
import ru.stopro.dto.student.StudentCreateResponse;
import ru.stopro.dto.student.StudentCredentialsDto;
import ru.stopro.dto.student.StudentDto;
import ru.stopro.repository.StudyGroupRepository;
import ru.stopro.repository.UserRepository;
import ru.stopro.repository.chat.GroupChatRepository;
import ru.stopro.service.chat.ChatService;

@Service
@RequiredArgsConstructor
public class TeacherService {

	private final UserRepository userRepository;
	private final StudyGroupRepository studyGroupRepository;
	private final GroupChatRepository groupChatRepository;
	private final PasswordEncoder passwordEncoder;
	private final ChatService chatService;

	private static final SecureRandom RANDOM = new SecureRandom();
	private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
	private static final int PASSWORD_LENGTH = 8;

	@Transactional(readOnly = true)
	public List<StudentDto> getStudentsByTeacherId(UUID teacherUserId) {
		Map<UUID, List<UUID>> studentToGroups = new LinkedHashMap<>();
		for (StudyGroup g : studyGroupRepository.findByTeacherId(teacherUserId)) {
			for (User s : g.getStudents()) {
				if (!Boolean.TRUE.equals(s.getIsDeleted())) {
					studentToGroups.computeIfAbsent(s.getId(), k -> new ArrayList<>()).add(g.getId());
				}
			}
		}
		List<StudentDto> result = new ArrayList<>();
		for (User s : userRepository.findByTeacherIdAndRoleAndIsDeletedFalse(teacherUserId, UserRole.STUDENT)) {
			result.add(StudentDto.fromEntity(s, studentToGroups.getOrDefault(s.getId(), new ArrayList<>())));
		}
		for (UUID studentId : studentToGroups.keySet()) {
			if (result.stream().noneMatch(dto -> dto.getId().equals(studentId))) {
				userRepository.findById(studentId)
						.ifPresent(s -> result.add(StudentDto.fromEntity(s, studentToGroups.get(studentId))));
			}
		}
		return result;
	}

	/** Создаёт ученика (группа опциональна). */
	@Transactional
	public StudentCreateResponse addStudent(UUID teacherUserId, StudentDto dto) {
		User teacher = userRepository.findById(teacherUserId)
				.orElseThrow(() -> new RuntimeException("Учитель не найден"));
		String fullName = (dto.getFullName() != null && !dto.getFullName().isBlank())
				? dto.getFullName().trim()
				: "Ученик";
		String username = generateUniqueUsername(fullName);
		String rawPassword = generatePassword();
		User student = User.builder().username(username).passwordHash(passwordEncoder.encode(rawPassword))
				.role(UserRole.STUDENT).fullName(fullName).teacher(teacher).dataConsentStatus(false).build();
		userRepository.save(student);
		chatService.getOrCreatePersonalChat(teacherUserId, student.getId());
		List<UUID> groupIds = resolveRequestedGroupIds(dto);
		for (UUID groupId : groupIds) {
			addStudentToGroupInternal(teacherUserId, student, groupId);
		}
		return StudentCreateResponse.builder().student(StudentDto.fromEntity(student, groupIds)).credentials(
				StudentCredentialsDto.builder().fullName(fullName).username(username).password(rawPassword).build())
				.build();
	}

	@Transactional
	public StudentDto updateStudent(UUID teacherUserId, UUID studentId, StudentDto dto) {
		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Ученик не найден"));
		if (!isTeacherOfStudent(teacherUserId, student)) {
			throw new RuntimeException("Нет прав на изменение этого ученика");
		}
		if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
			student.setFullName(dto.getFullName().trim());
		}
		userRepository.save(student);

		if (dto.getGroupIds() == null && dto.getGroupId() == null) {
			return StudentDto.fromEntity(student, currentGroupIds(teacherUserId, studentId));
		}

		List<UUID> desired = resolveRequestedGroupIds(dto);
		List<UUID> current = currentGroupIds(teacherUserId, studentId);

		for (UUID groupId : current) {
			if (!desired.contains(groupId)) {
				removeStudentFromGroupInternal(teacherUserId, student, groupId);
			}
		}
		for (UUID groupId : desired) {
			if (!current.contains(groupId)) {
				addStudentToGroupInternal(teacherUserId, student, groupId);
			}
		}
		return StudentDto.fromEntity(student, desired);
	}

	@Transactional
	public void deleteStudent(UUID teacherUserId, UUID studentId) {
		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Ученик не найден"));
		if (!isTeacherOfStudent(teacherUserId, student)) {
			throw new RuntimeException("Нет прав на удаление этого ученика");
		}
		for (UUID groupId : currentGroupIds(teacherUserId, studentId)) {
			removeStudentFromGroupInternal(teacherUserId, student, groupId);
		}
		chatService.deletePersonalChat(teacherUserId, studentId);
		student.setTeacher(null);
		student.setIsDeleted(true);
		userRepository.save(student);
	}

	private boolean isTeacherOfStudent(UUID teacherUserId, User student) {
		if (teacherUserId.equals(student.getTeacher() != null ? student.getTeacher().getId() : null)) {
			return true;
		}
		return studyGroupRepository.findByTeacherId(teacherUserId).stream()
				.anyMatch(g -> g.getStudents().stream().anyMatch(s -> s.getId().equals(student.getId())));
	}

	/** Список ID групп учителя, в которых сейчас состоит ученик. */
	private List<UUID> currentGroupIds(UUID teacherUserId, UUID studentId) {
		List<UUID> ids = new ArrayList<>();
		for (StudyGroup g : studyGroupRepository.findByTeacherId(teacherUserId)) {
			if (g.getStudents().stream().anyMatch(s -> s.getId().equals(studentId))) {
				ids.add(g.getId());
			}
		}
		return ids;
	}

	/** Желаемый набор групп из запроса: предпочитает groupIds, иначе одиночный groupId. */
	private List<UUID> resolveRequestedGroupIds(StudentDto dto) {
		if (dto.getGroupIds() != null) {
			return new ArrayList<>(new LinkedHashSet<>(dto.getGroupIds()));
		}
		if (dto.getGroupId() != null) {
			return new ArrayList<>(List.of(dto.getGroupId()));
		}
		return new ArrayList<>();
	}

	/** Добавляет ученика в группу (и в связанный групповой чат), не трогая остальные группы. */
	private void addStudentToGroupInternal(UUID teacherUserId, User student, UUID groupId) {
		StudyGroup group = studyGroupRepository.findById(groupId)
				.orElseThrow(() -> new RuntimeException("Группа не найдена"));
		if (!group.getTeacher().getId().equals(teacherUserId)) {
			throw new RuntimeException("Группа принадлежит другому учителю");
		}
		Optional<GroupChat> chat = groupChatRepository.findByStudyGroupId(groupId);
		if (chat.isPresent()) {
			chatService.addStudentToGroupChat(chat.get().getId(), student.getId(), teacherUserId);
		} else if (group.getStudents().stream().noneMatch(s -> s.getId().equals(student.getId()))) {
			group.getStudents().add(student);
			studyGroupRepository.save(group);
		}
	}

	/** Убирает ученика из одной группы (и из связанного группового чата), не трогая остальные. */
	private void removeStudentFromGroupInternal(UUID teacherUserId, User student, UUID groupId) {
		Optional<GroupChat> chat = groupChatRepository.findByStudyGroupId(groupId);
		if (chat.isPresent()) {
			chatService.removeStudentFromGroupChat(chat.get().getId(), student.getId(), teacherUserId);
			return;
		}
		StudyGroup group = studyGroupRepository.findById(groupId).orElse(null);
		if (group != null) {
			group.getStudents().removeIf(s -> s.getId().equals(student.getId()));
			studyGroupRepository.save(group);
		}
	}

	private String generateUniqueUsername(String fullName) {
		String[] parts = fullName.trim().split("\\s+");
		String base = (parts.length > 0 ? parts[parts.length - 1] : "user").toLowerCase().replaceAll("[^a-zа-яё]", "");
		if (base.isEmpty())
			base = "user";
		String username;
		int suffix = 100;
		do {
			username = base + "_" + suffix++;
		} while (userRepository.existsByUsername(username) && suffix < 100000);
		return username;
	}

	private String generatePassword() {
		StringBuilder sb = new StringBuilder(PASSWORD_LENGTH);
		for (int i = 0; i < PASSWORD_LENGTH; i++) {
			sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
		}
		return sb.toString();
	}
}
