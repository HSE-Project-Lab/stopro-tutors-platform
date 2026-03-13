package ru.stopro.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import ru.stopro.domain.entity.User;
import ru.stopro.dto.assignment.AssignmentCreateRequest;
import ru.stopro.dto.assignment.AssignmentDto;
import ru.stopro.dto.assignment.GenerateAssignmentRequest;
import ru.stopro.repository.UserRepository;
import ru.stopro.service.AssignmentService;

/**
 * Контроллер для работы с тестами и домашними заданиями
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/assignments")
@RequiredArgsConstructor
@Tag(name = "Assignments", description = "API для создания и управления тестами/ДЗ")
public class AssignmentController {

	private final AssignmentService assignmentService;
	private final UserRepository userRepository;

	/**
	 * Создать тест вручную (выбирая конкретные задачи)
	 */
	@Operation(summary = "Создать тест вручную", description = "Создаёт тест из выбранных задач")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Тест создан"),
			@ApiResponse(responseCode = "400", description = "Некорректные данные"),
			@ApiResponse(responseCode = "404", description = "Задачи не найдены")})
	@PostMapping
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> createAssignment(@Valid @RequestBody AssignmentCreateRequest request,
			@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		AssignmentDto assignment = assignmentService.create(user.getId(), request);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Автоматическая генерация теста по критериям
	 */
	@Operation(summary = "Сгенерировать тест", description = "Автоматически генерирует тест по заданным критериям")
	@PostMapping("/generate")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> generateAssignment(@Valid @RequestBody GenerateAssignmentRequest request,
			@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		AssignmentDto assignment = assignmentService.generate(user.getId(), request);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Получить тест по ID
	 */
	@Operation(summary = "Получить тест", description = "Возвращает информацию о тесте")
	@GetMapping("/{id}")
	public ResponseEntity<AssignmentDto> getAssignment(@PathVariable UUID id) {
		AssignmentDto assignment = assignmentService.getById(id);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Получить все тесты учителя
	 */
	@Operation(summary = "Мои тесты", description = "Возвращает все тесты текущего учителя")
	@GetMapping("/my")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<List<AssignmentDto>> getMyAssignments(@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		List<AssignmentDto> assignments = assignmentService.getByTeacher(user.getId());
		return ResponseEntity.ok(assignments);
	}

	/**
	 * Получить тесты группы
	 */
	@Operation(summary = "Получить тесты группы", description = "Возвращает все тесты для указанной группы")
	@GetMapping("/group/{groupId}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<List<AssignmentDto>> getGroupAssignments(@PathVariable UUID groupId) {
		List<AssignmentDto> assignments = assignmentService.getByGroup(groupId);
		return ResponseEntity.ok(assignments);
	}

	@Operation(summary = "Опубликовать из шаблона", description = "Создает активное задание на базе шаблона")
	@PostMapping("/{id}/publish-from-template")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> publishFromTemplate(@PathVariable UUID id,
			@RequestBody ru.stopro.dto.assignment.PublishTemplateRequest request) {
		AssignmentDto assignment = assignmentService.publishFromTemplate(id, request);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Опубликовать тест (сделать доступным для учеников)
	 */
	@Operation(summary = "Опубликовать", description = "Делает тест доступным для прохождения")
	@PostMapping("/{id}/publish")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> publishAssignment(@PathVariable UUID id) {
		AssignmentDto assignment = assignmentService.publish(id);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Архивировать тест
	 */
	@Operation(summary = "Архивировать", description = "Переносит тест в архив")
	@PostMapping("/{id}/archive")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> archiveAssignment(@PathVariable UUID id) {
		AssignmentDto assignment = assignmentService.archive(id);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Дублировать тест
	 */
	@Operation(summary = "Дублировать", description = "Создаёт копию теста")
	@PostMapping("/{id}/duplicate")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> duplicateAssignment(@PathVariable UUID id,
			@RequestParam(required = false) UUID newGroupId,
			@RequestParam(required = false) LocalDateTime newDeadline) {
		AssignmentDto assignment = assignmentService.duplicate(id, newGroupId, newDeadline);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Продлить дедлайн
	 */
	@Operation(summary = "Продлить дедлайн", description = "Изменяет дедлайн теста")
	@PutMapping("/{id}/extend")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> extendDeadline(@PathVariable UUID id,
			@RequestParam LocalDateTime newDeadline) {
		AssignmentDto assignment = assignmentService.extendDeadline(id, newDeadline);
		return ResponseEntity.ok(assignment);
	}

	/**
	 * Получить статистику по тесту
	 */
	@Operation(summary = "Статистика теста", description = "Возвращает статистику прохождения теста")
	@GetMapping("/{id}/statistics")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> getStatistics(@PathVariable UUID id) {
		AssignmentDto stats = assignmentService.getStatistics(id);
		return ResponseEntity.ok(stats);
	}

	/**
	 * Обновить тест (название, дедлайн, задачи)
	 */
	@Operation(summary = "Обновить ДЗ", description = "Изменяет название, дедлайн и список задач")
	@PutMapping("/{id}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<AssignmentDto> updateAssignment(@PathVariable UUID id,
			@Valid @RequestBody AssignmentCreateRequest request) {
		AssignmentDto assignment = assignmentService.update(id, request);
		return ResponseEntity.ok(assignment);
	}

	@Operation(summary = "Удалить ДЗ", description = "Полностью удаляет задание из базы")
	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Void> deleteAssignment(@PathVariable UUID id) {
		assignmentService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
