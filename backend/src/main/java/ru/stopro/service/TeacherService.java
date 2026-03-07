package ru.stopro.service;

import java.util.*;

import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.StudyGroup;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.UserRole;
import ru.stopro.dto.student.StudentDto;
import ru.stopro.repository.StudyGroupRepository;
import ru.stopro.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class TeacherService {

	private final UserRepository userRepository;
	private final StudyGroupRepository studyGroupRepository;
	private final PasswordEncoder passwordEncoder;

	private static final String DEMO_PASSWORD = "demo";

	@Transactional(readOnly = true)
	public List<StudentDto> getStudentsByTeacherId(UUID teacherUserId) {
		Map<UUID, UUID> studentToGroup = new HashMap<>();
		for (StudyGroup g : studyGroupRepository.findByTeacherId(teacherUserId)) {
			for (User s : g.getStudents()) {
				if (!Boolean.TRUE.equals(s.getIsDeleted())) {
					studentToGroup.putIfAbsent(s.getId(), g.getId());
				}
			}
		}
		Set<UUID> fromGroups = studentToGroup.keySet();
		List<StudentDto> result = new ArrayList<>();
		for (User s : userRepository.findByTeacherIdAndRoleAndIsDeletedFalse(teacherUserId, UserRole.STUDENT)) {
			result.add(StudentDto.fromEntity(s, studentToGroup.get(s.getId())));
		}
		for (UUID studentId : fromGroups) {
			if (result.stream().noneMatch(dto -> dto.getId().equals(studentId))) {
				userRepository.findById(studentId)
						.ifPresent(s -> result.add(StudentDto.fromEntity(s, studentToGroup.get(studentId))));
			}
		}
		return result;
	}

	/** Создаёт ученика (группа опциональна). */
	@Transactional
	public StudentDto addStudent(UUID teacherUserId, StudentDto dto) {
		User teacher = userRepository.findById(teacherUserId)
				.orElseThrow(() -> new RuntimeException("Учитель не найден"));
		String fullName = (dto.getFullName() != null && !dto.getFullName().isBlank())
				? dto.getFullName().trim()
				: "Ученик";
		String username = generateUniqueUsername(fullName);
		User student = User.builder().username(username).passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
				.role(UserRole.STUDENT).fullName(fullName).teacher(teacher).dataConsentStatus(false).build();
		userRepository.save(student);
		UUID groupId = dto.getGroupId();
		if (groupId != null) {
			StudyGroup group = studyGroupRepository.findById(groupId)
					.orElseThrow(() -> new RuntimeException("Группа не найдена"));
			if (!group.getTeacher().getId().equals(teacherUserId)) {
				throw new RuntimeException("Группа принадлежит другому учителю");
			}
			group.getStudents().add(student);
			studyGroupRepository.save(group);
		}
		return StudentDto.fromEntity(student, groupId);
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
		UUID newGroupId = dto.getGroupId();
		UUID currentGroupId = findStudentGroupId(teacherUserId, studentId);
		if (Objects.equals(currentGroupId, newGroupId)) {
			return StudentDto.fromEntity(student, currentGroupId);
		}
		if (currentGroupId != null) {
			StudyGroup old = studyGroupRepository.findById(currentGroupId).orElse(null);
			if (old != null) {
				old.getStudents().removeIf(s -> s.getId().equals(studentId));
				studyGroupRepository.save(old);
			}
		}
		if (newGroupId != null) {
			StudyGroup group = studyGroupRepository.findById(newGroupId)
					.orElseThrow(() -> new RuntimeException("Группа не найдена"));
			if (!group.getTeacher().getId().equals(teacherUserId)) {
				throw new RuntimeException("Группа принадлежит другому учителю");
			}
			group.getStudents().add(student);
			studyGroupRepository.save(group);
		}
		return StudentDto.fromEntity(student, newGroupId);
	}

	@Transactional
	public void deleteStudent(UUID teacherUserId, UUID studentId) {
		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Ученик не найден"));
		if (!isTeacherOfStudent(teacherUserId, student)) {
			throw new RuntimeException("Нет прав на удаление этого ученика");
		}
		for (StudyGroup g : studyGroupRepository.findByTeacherId(teacherUserId)) {
			g.getStudents().removeIf(s -> s.getId().equals(studentId));
			studyGroupRepository.save(g);
		}
		student.setTeacher(null);
		userRepository.save(student);
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

	private UUID findStudentGroupId(UUID teacherId, UUID studentId) {
		for (StudyGroup g : studyGroupRepository.findByTeacherId(teacherId)) {
			if (g.getStudents().stream().anyMatch(s -> s.getId().equals(studentId))) {
				return g.getId();
			}
		}
		return null;
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
}
