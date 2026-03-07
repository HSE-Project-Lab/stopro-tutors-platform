package ru.stopro.controller;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ru.stopro.domain.entity.User;
import ru.stopro.dto.attempt.AttemptDto;
import ru.stopro.dto.attempt.AttemptResultDto;
import ru.stopro.dto.attempt.SubmitAnswerRequest;
import ru.stopro.repository.UserRepository;
import ru.stopro.service.AttemptService;

/**
 * Контроллер для работы с попытками решения задач
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/attempts")
@RequiredArgsConstructor
@Tag(name = "Attempts", description = "API для прохождения тестов и отправки ответов")
public class AttemptController {

	private final AttemptService attemptService;
	private final UserRepository userRepository;

	/**
	 * Начать новую попытку решения задания
	 */
	@Operation(summary = "Начать попытку", description = "Создаёт новую попытку прохождения теста")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Попытка создана"),
			@ApiResponse(responseCode = "400", description = "Превышен лимит попыток"),
			@ApiResponse(responseCode = "404", description = "Задание не найдено")})
	@PostMapping("/start/{assignmentId}")
	@PreAuthorize("hasRole('STUDENT')")
	public ResponseEntity<AttemptDto> startAttempt(@PathVariable UUID assignmentId,
			@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		AttemptDto attempt = attemptService.startAttempt(user.getId(), assignmentId);
		return ResponseEntity.ok(attempt);
	}

	/**
	 * Отправить ответ на задачу
	 */
	@Operation(summary = "Отправить ответ", description = "Сохраняет ответ ученика на конкретную задачу")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Ответ сохранён"),
			@ApiResponse(responseCode = "400", description = "Попытка уже завершена"),
			@ApiResponse(responseCode = "404", description = "Попытка не найдена")})
	@PostMapping("/{attemptId}/submit")
	@PreAuthorize("hasRole('STUDENT')")
	public ResponseEntity<AttemptDto> submitAnswer(@PathVariable UUID attemptId,
			@Valid @RequestBody SubmitAnswerRequest request, @AuthenticationPrincipal UserDetails userDetails) {

		AttemptDto attempt = attemptService.submitAnswer(attemptId, request);
		return ResponseEntity.ok(attempt);
	}

	/**
	 * Завершить попытку
	 */
	@Operation(summary = "Завершить попытку", description = "Завершает попытку и подсчитывает результат")
	@PostMapping("/{attemptId}/finish")
	@PreAuthorize("hasRole('STUDENT')")
	public ResponseEntity<AttemptResultDto> finishAttempt(@PathVariable UUID attemptId,
			@AuthenticationPrincipal UserDetails userDetails) {

		AttemptResultDto result = attemptService.finishAttempt(attemptId);
		return ResponseEntity.ok(result);
	}

	/**
	 * Получить текущую попытку
	 */
	@Operation(summary = "Получить попытку", description = "Возвращает информацию о попытке")
	@GetMapping("/{attemptId}")
	public ResponseEntity<AttemptDto> getAttempt(@PathVariable UUID attemptId) {
		AttemptDto attempt = attemptService.getAttempt(attemptId);
		return ResponseEntity.ok(attempt);
	}

	/**
	 * Получить результат попытки
	 */
	@Operation(summary = "Результат попытки", description = "Возвращает детальный результат с правильными ответами")
	@GetMapping("/{attemptId}/result")
	public ResponseEntity<AttemptResultDto> getAttemptResult(@PathVariable UUID attemptId) {
		AttemptResultDto result = attemptService.getAttemptResult(attemptId);
		return ResponseEntity.ok(result);
	}

	/**
	 * Получить все попытки текущего ученика
	 */
	@Operation(summary = "Мои попытки", description = "Возвращает список всех попыток текущего ученика")
	@GetMapping("/my")
	@PreAuthorize("hasRole('STUDENT')")
	public ResponseEntity<List<AttemptDto>> getMyAttempts(@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		List<AttemptDto> attempts = attemptService.getStudentAttempts(user.getId());
		return ResponseEntity.ok(attempts);
	}

	/**
	 * Запросить AI-анализ решения
	 */
	@Operation(summary = "AI-анализ", description = "Запрашивает анализ решения через AI-сервис")
	@PostMapping("/{attemptId}/analyze")
	@PreAuthorize("hasRole('STUDENT')")
	public ResponseEntity<AttemptDto> requestAiAnalysis(@PathVariable UUID attemptId,
			@AuthenticationPrincipal UserDetails userDetails) {

		AttemptDto attempt = attemptService.requestAiAnalysis(attemptId);
		return ResponseEntity.ok(attempt);
	}
}
