package ru.stopro.controller;

import java.util.List;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.entity.User;
import ru.stopro.dto.assignment.AssignmentDto;
import ru.stopro.repository.AssignmentRepository;

/**
 * Контроллер личного кабинета ученика.
 *
 * Все эндпоинты доступны только пользователям с ролью STUDENT.
 */
@Slf4j
@RestController
@RequestMapping("/api/student")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
@Tag(name = "Student", description = "API личного кабинета ученика")
public class StudentAssignmentController {

	private final AssignmentRepository assignmentRepository;

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
	public ResponseEntity<List<AssignmentDto>> getMyAssignments(@AuthenticationPrincipal User student) {
		log.info("Ученик {} запрашивает свои задания", student.getUsername());

		List<Assignment> assignments = assignmentRepository.findActiveForStudent(student.getId());

		List<AssignmentDto> dtos = assignments.stream().map(AssignmentDto::fromEntity).toList();

		return ResponseEntity.ok(dtos);
	}
}
