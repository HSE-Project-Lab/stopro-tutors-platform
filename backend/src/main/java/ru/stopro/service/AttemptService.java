package ru.stopro.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.entity.Attempt;
import ru.stopro.domain.entity.Question;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AttemptStatus;
import ru.stopro.dto.attempt.AttemptDto;
import ru.stopro.dto.attempt.AttemptResultDto;
import ru.stopro.dto.attempt.SubmitAnswerRequest;
import ru.stopro.repository.AssignmentRepository;
import ru.stopro.repository.AttemptRepository;
import ru.stopro.repository.QuestionRepository;
import ru.stopro.repository.UserRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AttemptService {

	private final AttemptRepository attemptRepository;
	private final AssignmentRepository assignmentRepository;
	private final QuestionRepository questionRepository;
	private final UserRepository userRepository;
	private final AiAnalysisService aiAnalysisService;

	/**
	 * Начать новую попытку
	 */
	@Transactional
	public AttemptDto startAttempt(UUID studentId, UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		// Проверяем лимит попыток
		long existingAttempts = attemptRepository.countByStudent_IdAndAssignment_Id(studentId, assignmentId);
		if (assignment.getMaxAttempts() != null && existingAttempts >= assignment.getMaxAttempts()) {
			throw new RuntimeException("Превышен лимит попыток");
		}

		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

		Attempt attempt = Attempt.builder().student(student).assignment(assignment).status(AttemptStatus.IN_PROGRESS)
				.startedAt(LocalDateTime.now()).correctCount(0).totalQuestions(assignment.getQuestions().size())
				.build();

		attempt = attemptRepository.save(attempt);
		log.info("Started attempt {} for student {} on assignment {}", attempt.getId(), studentId, assignmentId);

		return mapToDto(attempt);
	}

	/**
	 * Отправить ответ на задачу
	 */
	@Transactional
	public AttemptDto submitAnswer(UUID attemptId, SubmitAnswerRequest request) {
		Attempt attempt = attemptRepository.findById(attemptId)
				.orElseThrow(() -> new RuntimeException("Attempt not found"));

		if (attempt.getStatus() != AttemptStatus.IN_PROGRESS) {
			throw new RuntimeException("Попытка уже завершена");
		}

		Assignment assignment = attempt.getAssignment();
		if (assignment.getTimeLimitMinutes() != null) {
			LocalDateTime deadline = attempt.getStartedAt().plusMinutes(assignment.getTimeLimitMinutes());
			if (LocalDateTime.now().isAfter(deadline)) {
				attempt.setStatus(AttemptStatus.TIMEOUT);
				attemptRepository.save(attempt);
				throw new RuntimeException("Время вышло");
			}
		}

		Question question = questionRepository.findById(request.getQuestionId())
				.orElseThrow(() -> new RuntimeException("Question not found"));

		Map<String, Object> answerData = new HashMap<>();
		answerData.put("answer", request.getAnswer());
		answerData.put("timeSpent", request.getTimeSpentSeconds());
		answerData.put("submittedAt", LocalDateTime.now().toString());

		boolean isCorrect = checkAnswer(question, request.getAnswer());
		answerData.put("isCorrect", isCorrect);

		// TODO: заглушка
		String answersJson = "{}";
		attempt.setAnswers(answersJson);

		if (isCorrect) {
			attempt.setCorrectCount(attempt.getCorrectCount() + 1);
		}

		if (request.getSolutionImage() != null) {
			attempt.setSolutionImageUrl(request.getSolutionImage());
		}

		attempt = attemptRepository.save(attempt);
		return mapToDto(attempt);
	}

	/**
	 * Завершить попытку
	 */
	@Transactional
	public AttemptResultDto finishAttempt(UUID attemptId) {
		Attempt attempt = attemptRepository.findById(attemptId)
				.orElseThrow(() -> new RuntimeException("Attempt not found"));

		attempt.setStatus(AttemptStatus.COMPLETED);
		attempt.setFinishedAt(LocalDateTime.now());

		double score = attempt.getTotalQuestions() > 0
				? (double) attempt.getCorrectCount() / attempt.getTotalQuestions() * 100
				: 0;
		attempt.setScore(score);

		attempt = attemptRepository.save(attempt);
		log.info("Finished attempt {} with score {}", attemptId, score);

		return mapToResultDto(attempt);
	}

	/**
	 * Получить попытку
	 */
	public AttemptDto getAttempt(UUID attemptId) {
		Attempt attempt = attemptRepository.findById(attemptId)
				.orElseThrow(() -> new RuntimeException("Attempt not found"));
		return mapToDto(attempt);
	}

	/**
	 * Получить результат попытки
	 */
	public AttemptResultDto getAttemptResult(UUID attemptId) {
		Attempt attempt = attemptRepository.findById(attemptId)
				.orElseThrow(() -> new RuntimeException("Attempt not found"));
		return mapToResultDto(attempt);
	}

	/**
	 * Получить все попытки ученика
	 */
	public List<AttemptDto> getStudentAttempts(UUID studentId) {
		return attemptRepository.findByStudent_IdOrderByStartedAtDesc(studentId).stream().map(this::mapToDto)
				.collect(Collectors.toList());
	}

	/**
	 * Запросить AI анализ
	 */
	@Transactional
	public AttemptDto requestAiAnalysis(UUID attemptId) {
		Attempt attempt = attemptRepository.findById(attemptId)
				.orElseThrow(() -> new RuntimeException("Attempt not found"));

		// TODO: заглушка - в реальности отправляем на AI сервис
		attempt.setAiFeedback("AI analysis pending");

		attempt = attemptRepository.save(attempt);
		return mapToDto(attempt);
	}

	/**
	 * Проверка ответа
	 */
	private boolean checkAnswer(Question question, String userAnswer) {
		if (userAnswer == null || userAnswer.trim().isEmpty()) {
			return false;
		}

		String normalized = normalizeAnswer(userAnswer);
		String correctNormalized = normalizeAnswer(question.getCorrectAnswer());

		if (normalized.equals(correctNormalized)) {
			return true;
		}

		if (question.getAlternativeAnswers() != null && !question.getAlternativeAnswers().isEmpty()) {
			String[] alternatives = question.getAlternativeAnswers().replace("[", "").replace("]", "").replace("\"", "")
					.split(",");
			for (String alt : alternatives) {
				if (normalized.equals(normalizeAnswer(alt.trim()))) {
					return true;
				}
			}
		}

		try {
			double userNum = Double.parseDouble(normalized.replace(",", "."));
			double correctNum = Double.parseDouble(correctNormalized.replace(",", "."));
			return Math.abs(userNum - correctNum) < 0.001;
		} catch (NumberFormatException e) {
		}

		return false;
	}

	/**
	 * Нормализация ответа
	 */
	private String normalizeAnswer(String answer) {
		if (answer == null)
			return "";

		return answer.trim().toLowerCase().replace(",", ".").replace(" ", "").replace("−", "-").replaceAll("\\.0+$",
				"");
	}

	private AttemptDto mapToDto(Attempt attempt) {
		return AttemptDto.builder().id(attempt.getId()).studentId(attempt.getStudentId())
				.assignmentId(attempt.getAssignment().getId()).assignmentTitle(attempt.getAssignment().getTitle())
				.status(attempt.getStatus()).startedAt(attempt.getStartedAt())
				.finishedAt(attempt.getFinishedAt() != null ? attempt.getFinishedAt() : attempt.getAnsweredAt())
				.pointsEarned(attempt.getPointsEarned()).maxPoints(attempt.getMaxPoints())
				.isCorrect(attempt.getIsCorrect()).build();
	}

	private AttemptResultDto mapToResultDto(Attempt attempt) {
		Assignment assignment = attempt.getAssignment();

		return AttemptResultDto.builder().id(attempt.getId()).assignmentTitle(assignment.getTitle())
				.status(attempt.getStatus()).startedAt(attempt.getStartedAt()).finishedAt(attempt.getFinishedAt())
				.correctCount(attempt.getCorrectCount()).totalQuestions(attempt.getTotalQuestions())
				.score(attempt.getScore()).answers(attempt.getAnswers()).aiFeedback(attempt.getAiFeedback())
				.showAnswers(assignment.isShowAnswersAfterCompletion())
				.showSolutions(assignment.isShowSolutionsAfterCompletion()).build();
	}
}
