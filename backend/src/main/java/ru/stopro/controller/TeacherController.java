package ru.stopro.controller;

import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import ru.stopro.domain.entity.User;
import ru.stopro.dto.student.StudentCreateResponse;
import ru.stopro.dto.student.StudentDto;
import ru.stopro.service.TeacherService;

@RestController
@RequestMapping("/api/v1/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('TEACHER', 'ROLE_TEACHER', 'ADMIN', 'ROLE_ADMIN')")
public class TeacherController {

	private final TeacherService teacherService;
	private final ru.stopro.service.GroupService groupService;

	@GetMapping("/students")
	public ResponseEntity<List<StudentDto>> getMyStudents(@AuthenticationPrincipal User user) {
		return ResponseEntity.ok(teacherService.getStudentsByTeacherId(user.getId()));
	}

	@PostMapping("/students")
	public ResponseEntity<StudentCreateResponse> addStudent(@AuthenticationPrincipal User user,
			@RequestBody StudentDto studentDto) {
		return ResponseEntity.ok(teacherService.addStudent(user.getId(), studentDto));
	}

	@PutMapping("/students/{id}")
	public ResponseEntity<StudentDto> updateStudent(@AuthenticationPrincipal User user,
			@PathVariable("id") UUID studentId, @RequestBody StudentDto studentDto) {
		return ResponseEntity.ok(teacherService.updateStudent(user.getId(), studentId, studentDto));
	}

	@DeleteMapping("/students/{id}")
	public ResponseEntity<Void> deleteStudent(@AuthenticationPrincipal User user,
			@PathVariable("id") java.util.UUID studentId) {
		teacherService.deleteStudent(user.getId(), studentId);
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/groups")
	public ResponseEntity<List<ru.stopro.dto.group.GroupResponse>> getMyGroups(@AuthenticationPrincipal User user) {
		return ResponseEntity.ok(groupService.getGroupsByTeacher(user.getId()));
	}
}
