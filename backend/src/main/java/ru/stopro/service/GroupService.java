package ru.stopro.service;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.StudyGroup;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.UserRole;
import ru.stopro.dto.group.*;
import ru.stopro.repository.StudyGroupRepository;
import ru.stopro.repository.UserRepository;
import ru.stopro.repository.chat.GroupChatRepository;
import ru.stopro.service.chat.ChatService;
import ru.stopro.dto.chat.CreateGroupChatRequest;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupService {

	private final StudyGroupRepository groupRepository;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final ChatService chatService;
	private final GroupChatRepository groupChatRepository;

	private static final SecureRandom RANDOM = new SecureRandom();
	private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
	private static final int PASSWORD_LENGTH = 8;

	@Transactional
	public GroupResponse createGroup(String name, UUID teacherId) {
		User teacher = userRepository.findById(teacherId)
				.orElseThrow(() -> new RuntimeException("Учитель не найден"));

		if (teacher.getRole() != UserRole.TEACHER) {
			throw new RuntimeException("Пользователь не является учителем");
		}

		StudyGroup group = StudyGroup.builder()
				.name(name)
				.teacher(teacher)
				.inviteCode(generateUniqueInviteCode())
				.build();

		groupRepository.save(group);

		chatService.createGroupChat(teacherId, new CreateGroupChatRequest(
				name,
				null,
				List.of(),
				group.getId()
		));

		log.info("Создана группа '{}' (id={}) учителем {}", name, group.getId(), teacher.getUsername());
		return toGroupResponse(group);
	}

	@Transactional
	public GroupResponse updateGroup(UUID groupId, String name, UUID teacherId) {
		StudyGroup group = groupRepository.findById(groupId)
				.orElseThrow(() -> new RuntimeException("Группа не найдена"));
		if (!group.getTeacher().getId().equals(teacherId)) {
			throw new RuntimeException("Нет прав на изменение этой группы");
		}
		group.setName(name);
		groupRepository.save(group);
		log.info("Группа {} переименована в '{}'", groupId, name);
		return toGroupResponse(group);
	}

	@Transactional
	public void deleteGroup(UUID groupId, UUID teacherId) {
		StudyGroup group = groupRepository.findById(groupId)
				.orElseThrow(() -> new RuntimeException("Группа не найдена"));
		if (!group.getTeacher().getId().equals(teacherId)) {
			throw new RuntimeException("Нет прав на удаление этой группы");
		}
		group.getStudents().clear();
		groupRepository.saveAndFlush(group);
		groupRepository.delete(group);
		log.info("Группа {} удалена", groupId);
	}

	@Transactional
	public AddStudentsResponse addStudentsToGroup(UUID groupId, List<String> studentNames) {
		StudyGroup group = groupRepository.findById(groupId)
				.orElseThrow(() -> new RuntimeException("Группа не найдена"));

		List<StudentCredentials> credentials = new ArrayList<>();
		List<UUID> newStudentIds = new ArrayList<>();

		for (String fullName : studentNames) {
			String username = generateUniqueUsername(fullName);
			String rawPassword = generatePassword();

			User student = User.builder()
					.username(username)
					.passwordHash(passwordEncoder.encode(rawPassword))
					.role(UserRole.STUDENT)
					.fullName(fullName.trim())
					.teacher(group.getTeacher())
					.dataConsentStatus(false)
					.build();

			userRepository.save(student);
			group.getStudents().add(student);
			newStudentIds.add(student.getId());

			credentials.add(StudentCredentials.builder()
					.fullName(fullName.trim())
					.username(username)
					.password(rawPassword)
					.build());

			log.info("Ученик '{}' (login={}) добавлен в группу '{}'", fullName, username, group.getName());
		}

		groupRepository.save(group);

		groupChatRepository.findByStudyGroupId(groupId).ifPresentOrElse(
				existingChat -> {
					for (UUID studentId : newStudentIds) {
						chatService.addStudentToGroupChat(existingChat.getId(), studentId, group.getTeacher().getId());
					}
				},
				() -> {
					chatService.createGroupChat(
							group.getTeacher().getId(),
							new CreateGroupChatRequest(
									group.getName(),
									null,
									newStudentIds,
									groupId
							)
					);
				}
		);

		return AddStudentsResponse.builder()
				.groupId(group.getId().toString())
				.groupName(group.getName())
				.credentials(credentials)
				.build();
	}

	private String generateUniqueUsername(String fullName) {
		String[] parts = fullName.trim().split("\\s+");
		String base = transliterate(parts[0]).toLowerCase();

		String username;
		do {
			int suffix = 100 + RANDOM.nextInt(900);
			username = base + "_" + suffix;
		} while (userRepository.existsByUsername(username));

		return username;
	}

	/**
	 * Генерирует случайный пароль длиной {@value PASSWORD_LENGTH} символов.
	 * Исключены символы, легко путающиеся: 0/O, 1/l/I.
	 */
	private String generatePassword() {
		StringBuilder sb = new StringBuilder(PASSWORD_LENGTH);
		for (int i = 0; i < PASSWORD_LENGTH; i++) {
			sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
		}
		return sb.toString();
	}

	/**
	 * Генерирует уникальный шестисимвольный invite-код для группы.
	 */
	private String generateUniqueInviteCode() {
		String code;
		do {
			code = generateRandomCode(6);
		} while (groupRepository.existsByInviteCode(code));
		return code;
	}

	private String generateRandomCode(int length) {
		String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
		StringBuilder sb = new StringBuilder(length);
		for (int i = 0; i < length; i++) {
			sb.append(chars.charAt(RANDOM.nextInt(chars.length())));
		}
		return sb.toString();
	}

	/**
	 * Простая транслитерация кириллицы → латиница (ГОСТ-подобная).
	 */
	private String transliterate(String input) {
		StringBuilder sb = new StringBuilder();
		for (char ch : input.toCharArray()) {
			sb.append(switch (Character.toLowerCase(ch)) {
				case 'а' -> "a";
				case 'б' -> "b";
				case 'в' -> "v";
				case 'г' -> "g";
				case 'д' -> "d";
				case 'е' -> "e";
				case 'ё' -> "yo";
				case 'ж' -> "zh";
				case 'з' -> "z";
				case 'и' -> "i";
				case 'й' -> "y";
				case 'к' -> "k";
				case 'л' -> "l";
				case 'м' -> "m";
				case 'н' -> "n";
				case 'о' -> "o";
				case 'п' -> "p";
				case 'р' -> "r";
				case 'с' -> "s";
				case 'т' -> "t";
				case 'у' -> "u";
				case 'ф' -> "f";
				case 'х' -> "kh";
				case 'ц' -> "ts";
				case 'ч' -> "ch";
				case 'ш' -> "sh";
				case 'щ' -> "shch";
				case 'ъ' -> "";
				case 'ы' -> "y";
				case 'ь' -> "";
				case 'э' -> "e";
				case 'ю' -> "yu";
				case 'я' -> "ya";
				default -> String.valueOf(ch);
			});
		}
		return sb.toString().replaceAll("[^a-z0-9]", "");
	}

	private GroupResponse toGroupResponse(StudyGroup group) {
		return GroupResponse.builder().id(group.getId().toString()).name(group.getName())
				.teacherId(group.getTeacher().getId().toString()).inviteCode(group.getInviteCode())
				.studentsCount(group.getStudents().size()).build();
	}

	/**
	 * Получить все группы указанного учителя
	 */
	@Transactional(readOnly = true)
	public List<GroupResponse> getGroupsByTeacher(UUID teacherId) {
		List<StudyGroup> groups = groupRepository.findByTeacherId(teacherId);
		List<GroupResponse> responses = new ArrayList<>();
		for (StudyGroup g : groups) {
			responses.add(toGroupResponse(g));
		}
		return responses;
	}
}
