package ru.stopro.controller;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import ru.stopro.domain.entity.User;
import ru.stopro.dto.assignment.AssignmentDto;
import ru.stopro.dto.assignment.AssignmentSubmissionResultDto;
import ru.stopro.dto.assignment.CompleteAssignmentRequest;
import ru.stopro.repository.UserRepository;
import ru.stopro.service.AssignmentService;

/**
 * Контроллер личного кабинета ученика.
 *
 * Все эндпоинты доступны только пользователям с ролью STUDENT.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Student", description = "API личного кабинета ученика")
public class StudentAssignmentController {

	private final AssignmentService assignmentService;
	private final UserRepository userRepository;

	/**
	 * Возвращает активные тесты/ДЗ группы, к которой привязан текущий ученик.
	 *
	 * Логика: 1. Из SecurityContext берём авторизованного User (ученик). 2. Через
	 * JPQL-запрос находим Assignment-ы, у которых group.students содержит этого
	 * пользователя и статус PUBLISHED. 3. Возвращаем список DTO без правильных
	 * ответов.
	 */
	@Operation(summary = "Мои задания", description = "Возвращает активные тесты и ДЗ для группы текущего ученика")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Список заданий"),
			@ApiResponse(responseCode = "403", description = "Нет прав (не ученик)")})
	@GetMapping("/assignments")
	public ResponseEntity<List<AssignmentDto>> getMyAssignments(@AuthenticationPrincipal UserDetails userDetails) {
		if (userDetails == null) {
			throw new ResponseStatusException(UNAUTHORIZED, "Требуется авторизация");
		}

		User student = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Пользователь не найден"));
		log.info("Ученик {} запрашивает свои задания", student.getUsername());

		List<AssignmentDto> dtos = assignmentService.getActiveForStudent(student.getId());

		return ResponseEntity.ok(dtos);
	}

	@Operation(summary = "Мои завершённые задания", description = "Возвращает задания, которые ученик уже сдал")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Список завершённых заданий"),
			@ApiResponse(responseCode = "401", description = "Требуется авторизация")})
	@GetMapping("/assignments/completed")
	public ResponseEntity<List<AssignmentDto>> getMyCompletedAssignments(
			@AuthenticationPrincipal UserDetails userDetails) {
		if (userDetails == null) {
			throw new ResponseStatusException(UNAUTHORIZED, "Требуется авторизация");
		}

		User student = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Пользователь не найден"));

		List<AssignmentDto> dtos = assignmentService.getCompletedForStudent(student.getId());
		return ResponseEntity.ok(dtos);
	}

	@Operation(summary = "Сдать задание", description = "Помечает задание как сданное текущим учеником")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Задание помечено как сданное"),
			@ApiResponse(responseCode = "403", description = "Нет прав на это задание"),
			@ApiResponse(responseCode = "404", description = "Задание не найдено")})
	@PostMapping("/assignments/{id}/complete")
	public ResponseEntity<AssignmentSubmissionResultDto> completeAssignment(
			@AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id,
			@RequestBody(required = false) CompleteAssignmentRequest request) {
		if (userDetails == null) {
			throw new ResponseStatusException(UNAUTHORIZED, "Требуется авторизация");
		}

		User student = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Пользователь не найден"));
		CompleteAssignmentRequest payload = request != null ? request : CompleteAssignmentRequest.builder().build();
		AssignmentSubmissionResultDto updated = assignmentService.completeByStudent(id, student.getId(),
				payload.getAnswers());
		return ResponseEntity.ok(updated);
	}

	@Operation(summary = "Результат сданного задания", description = "Возвращает сохранённый результат проверки для текущего ученика")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Результат найден"),
			@ApiResponse(responseCode = "404", description = "Результат не найден")})
	@GetMapping("/assignments/{id}/result")
	public ResponseEntity<AssignmentSubmissionResultDto> getSubmissionResult(
			@AuthenticationPrincipal UserDetails userDetails, @PathVariable UUID id) {
		if (userDetails == null) {
			throw new ResponseStatusException(UNAUTHORIZED, "Требуется авторизация");
		}

		User student = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Пользователь не найден"));

		AssignmentSubmissionResultDto result = assignmentService.getStudentSubmissionResult(id, student.getId());
		return ResponseEntity.ok(result);
	}
}
