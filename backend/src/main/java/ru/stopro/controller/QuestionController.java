package ru.stopro.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
import org.springframework.web.bind.annotation.RestController;

import ru.stopro.domain.entity.User;
import ru.stopro.dto.question.QuestionCreateRequest;
import ru.stopro.dto.question.QuestionDto;
import ru.stopro.dto.question.QuestionFilterRequest;
import ru.stopro.repository.UserRepository;
import ru.stopro.service.QuestionService;

/**
 * Контроллер для работы с базой задач
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/questions")
@RequiredArgsConstructor
@Tag(name = "Questions", description = "API для управления базой задач")
public class QuestionController {

	private final QuestionService questionService;
	private final UserRepository userRepository;

	/**
	 * Создать новую задачу
	 */
	@Operation(summary = "Создать задачу", description = "Добавляет новую задачу в авторскую базу учителя")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Задача создана"),
			@ApiResponse(responseCode = "400", description = "Некорректные данные")})
	@PostMapping
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<QuestionDto> createQuestion(@Valid @RequestBody QuestionCreateRequest request,
			@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		QuestionDto question = questionService.create(user.getId(), request);
		return ResponseEntity.ok(question);
	}

	/**
	 * Обновить задачу
	 */
	@Operation(summary = "Обновить задачу", description = "Изменяет существующую задачу")
	@PutMapping("/{id}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<QuestionDto> updateQuestion(@PathVariable UUID id,
			@Valid @RequestBody QuestionCreateRequest request) {
		QuestionDto question = questionService.update(id, request);
		return ResponseEntity.ok(question);
	}

	/**
	 * Удалить задачу (мягкое удаление)
	 */
	@Operation(summary = "Удалить задачу", description = "Помечает задачу как удалённую")
	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Map<String, String>> deleteQuestion(@PathVariable UUID id) {
		questionService.delete(id);
		Map<String, String> response = new HashMap<>();
		response.put("message", "Задача удалена");
		return ResponseEntity.ok(response);
	}

	/**
	 * Получить задачу по ID
	 */
	@Operation(summary = "Получить задачу", description = "Возвращает задачу по ID")
	@GetMapping("/{id}")
	public ResponseEntity<QuestionDto> getQuestion(@PathVariable UUID id) {
		QuestionDto question = questionService.getById(id);
		return ResponseEntity.ok(question);
	}

	/**
	 * Получить все задачи учителя
	 */
	@Operation(summary = "Мои задачи", description = "Возвращает все задачи текущего учителя")
	@GetMapping("/my")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Page<QuestionDto>> getMyQuestions(@AuthenticationPrincipal UserDetails userDetails,
			Pageable pageable) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		Page<QuestionDto> questions = questionService.getByTeacher(user.getId(), pageable);
		return ResponseEntity.ok(questions);
	}

	/**
	 * Поиск задач с фильтрами
	 */
	@Operation(summary = "Поиск задач", description = "Поиск задач по темам, сложности, тегам")
	@PostMapping("/search")
	public ResponseEntity<Page<QuestionDto>> searchQuestions(@RequestBody QuestionFilterRequest filter,
			Pageable pageable) {
		Page<QuestionDto> questions = questionService.search(filter, pageable);
		return ResponseEntity.ok(questions);
	}

	/**
	 * Дублировать задачу
	 */
	@Operation(summary = "Дублировать задачу", description = "Создаёт копию задачи в авторской базе")
	@PostMapping("/{id}/duplicate")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<QuestionDto> duplicateQuestion(@PathVariable UUID id,
			@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		QuestionDto question = questionService.duplicate(id, user.getId());
		return ResponseEntity.ok(question);
	}

	/**
	 * Импорт задач из банка
	 */
	@Operation(summary = "Импорт задач", description = "Импортирует задачи из публичного банка")
	@PostMapping("/import")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<List<QuestionDto>> importQuestions(@RequestBody List<UUID> questionIds,
			@AuthenticationPrincipal UserDetails userDetails) {

		User user = userRepository.findByUsername(userDetails.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		List<QuestionDto> questions = questionService.importFromBank(user.getId(), questionIds);
		return ResponseEntity.ok(questions);
	}

	/**
	 * Проверка LaTeX синтаксиса
	 */
	@Operation(summary = "Проверить LaTeX", description = "Валидирует LaTeX-разметку в задаче")
	@PostMapping("/validate-latex")
	@PreAuthorize("hasRole('TEACHER')")
	public ResponseEntity<Map<String, Object>> validateLatex(@RequestBody Map<String, String> request) {
		String content = request.get("content");
		boolean isValid = questionService.validateLatex(content);

		Map<String, Object> response = new HashMap<>();
		response.put("valid", isValid);
		if (!isValid) {
			response.put("message", "Некорректный LaTeX синтаксис");
		}
		return ResponseEntity.ok(response);
	}

	/**
	 * Получить публичный банк задач
	 */
	@Operation(summary = "Банк задач", description = "Возвращает публичные задачи из общего банка")
	@GetMapping("/bank")
	public ResponseEntity<Page<QuestionDto>> getPublicBank(Pageable pageable) {
		Page<QuestionDto> questions = questionService.getPublicBank(pageable);
		return ResponseEntity.ok(questions);
	}
}
