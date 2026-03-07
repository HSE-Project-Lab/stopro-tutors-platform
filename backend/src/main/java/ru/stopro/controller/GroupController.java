package ru.stopro.controller;

import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import ru.stopro.domain.entity.User;
import ru.stopro.dto.group.AddStudentsRequest;
import ru.stopro.dto.group.AddStudentsResponse;
import ru.stopro.dto.group.CreateGroupRequest;
import ru.stopro.dto.group.GroupResponse;
import ru.stopro.service.GroupService;

/**
 * Контроллер управления учебными группами.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('TEACHER', 'ROLE_TEACHER', 'ADMIN', 'ROLE_ADMIN')")
@Tag(name = "Groups", description = "API управления учебными группами")
public class GroupController {

	private final GroupService groupService;

	/**
	 * Создание новой учебной группы.
	 */
	@Operation(summary = "Создать группу", description = "Учитель создаёт новую учебную группу")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Группа успешно создана"),
			@ApiResponse(responseCode = "400", description = "Невалидные данные"),
			@ApiResponse(responseCode = "403", description = "Нет прав (не учитель)")})
	@PostMapping
	public ResponseEntity<GroupResponse> createGroup(@AuthenticationPrincipal User teacher,
			@Valid @RequestBody CreateGroupRequest request) {
		log.info("Учитель {} создаёт группу '{}'", teacher.getUsername(), request.getName());
		GroupResponse response = groupService.createGroup(request.getName(), teacher.getId());
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@Operation(summary = "Обновить группу")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Группа обновлена"),
			@ApiResponse(responseCode = "404", description = "Группа не найдена"),
			@ApiResponse(responseCode = "403", description = "Нет прав")})
	@PutMapping("/{id}")
	public ResponseEntity<GroupResponse> updateGroup(@AuthenticationPrincipal User teacher,
			@PathVariable("id") UUID groupId, @Valid @RequestBody CreateGroupRequest request) {
		GroupResponse response = groupService.updateGroup(groupId, request.getName(), teacher.getId());
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Удалить группу")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Группа удалена"),
			@ApiResponse(responseCode = "404", description = "Группа не найдена"),
			@ApiResponse(responseCode = "403", description = "Нет прав")})
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteGroup(@AuthenticationPrincipal User teacher, @PathVariable("id") UUID groupId) {
		groupService.deleteGroup(groupId, teacher.getId());
		return ResponseEntity.noContent().build();
	}

	/**
	 * Массовое добавление учеников в группу.
	 *
	 * Для каждого ФИО генерируется уникальный логин и временный пароль. Ответ
	 * содержит чистые пароли (для распечатки учителем). В БД хранятся только
	 * BCrypt-хеши.
	 */
	@Operation(summary = "Добавить учеников", description = "Массовое создание учеников с генерацией логинов и паролей")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Ученики добавлены, возвращены учётные данные"),
			@ApiResponse(responseCode = "404", description = "Группа не найдена"),
			@ApiResponse(responseCode = "403", description = "Нет прав (не учитель)")})
	@PostMapping("/{id}/students")
	public ResponseEntity<AddStudentsResponse> addStudents(@PathVariable("id") UUID groupId,
			@Valid @RequestBody AddStudentsRequest request) {
		log.info("Добавление {} учеников в группу {}", request.getStudentNames().size(), groupId);
		AddStudentsResponse response = groupService.addStudentsToGroup(groupId, request.getStudentNames());
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}
}
