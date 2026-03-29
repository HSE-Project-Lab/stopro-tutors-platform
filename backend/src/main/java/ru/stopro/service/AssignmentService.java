package ru.stopro.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.entity.Attempt;
import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.entity.Question;
import ru.stopro.domain.entity.StudentAssignmentAnswerResult;
import ru.stopro.domain.entity.StudentAssignmentSubmission;
import ru.stopro.domain.entity.StudyGroup;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AssignmentStatus;
import ru.stopro.domain.enums.AttemptStatus;
import ru.stopro.domain.enums.TaskDifficulty;
import ru.stopro.dto.assignment.AssignmentCreateRequest;
import ru.stopro.dto.assignment.AssignmentDto;
import ru.stopro.dto.assignment.AssignmentSubmissionResultDto;
import ru.stopro.dto.assignment.GenerateAssignmentRequest;
import ru.stopro.repository.AssignmentRepository;
import ru.stopro.repository.AttemptRepository;
import ru.stopro.repository.EgeTaskRepository;
import ru.stopro.repository.QuestionRepository;
import ru.stopro.repository.StudentAssignmentSubmissionRepository;
import ru.stopro.repository.StudyGroupRepository;
import ru.stopro.repository.UserRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentService {

	private final AssignmentRepository assignmentRepository;
	private final AttemptRepository attemptRepository;
	private final QuestionRepository questionRepository;
	private final EgeTaskRepository egeTaskRepository;
	private final StudyGroupRepository studyGroupRepository;
	private final UserRepository userRepository;
	private final StudentAssignmentSubmissionRepository studentAssignmentSubmissionRepository;

	@Transactional
	public AssignmentDto create(UUID teacherId, AssignmentCreateRequest request) {
		User teacher = userRepository.findById(teacherId).orElseThrow(() -> new RuntimeException("Учитель не найден"));

		StudyGroup group = null;
		User student = null;

		if (!request.isTemplate()) {
			if (request.getGroupId() != null) {
				group = studyGroupRepository.findById(request.getGroupId()).orElse(null);
			}
			if (request.getStudentId() != null) {
				student = userRepository.findById(request.getStudentId()).orElse(null);
			}
		}

		List<Question> rawQuestions = questionRepository
				.findAllById(request.getQuestionIds().stream().map(UUID::fromString).collect(Collectors.toList()));
		List<Question> questions = new ArrayList<>();
		for (String qId : request.getQuestionIds()) {
			UUID uuid = UUID.fromString(qId);
			rawQuestions.stream().filter(q -> q.getId().equals(uuid)).findFirst().ifPresent(questions::add);
		}

		List<EgeTask> egeTasks = new ArrayList<>(egeTaskRepository.findAllById(request.getQuestionIds()));

		Assignment assignment = Assignment.builder().title(request.getTitle()).description(request.getDescription())
				.teacher(teacher).createdById(teacherId).group(group).student(student).questions(questions)
				.egeTasks(egeTasks).deadline(request.getDeadline()).isTemplate(request.isTemplate())
				.timeLimitMinutes(request.getTimeLimitMinutes()).maxAttempts(request.getMaxAttempts())
				.status(request.isTemplate() ? AssignmentStatus.DRAFT : AssignmentStatus.PUBLISHED)
				.showCorrectAnswers(request.isShowAnswersAfterCompletion())
				.showSolutions(request.isShowSolutionsAfterCompletion()).build();

		assignment = assignmentRepository.save(assignment);
		log.info("Created assignment {} by teacher {} (Template: {})", assignment.getId(), teacherId,
				request.isTemplate());

		return mapToDto(assignment, false);
	}

	@Transactional
	public AssignmentDto generate(UUID teacherId, GenerateAssignmentRequest request) {
		log.info("Generating assignment for teacher {} with {} questions", teacherId, request.getQuestionCount());

		User teacher = userRepository.findById(teacherId).orElseThrow(() -> new RuntimeException("Учитель не найден"));

		final List<Question> selectedQuestions = new ArrayList<>();

		if (request.getEgeNumbers() != null && !request.getEgeNumbers().isEmpty()) {
			for (Integer egeNumber : request.getEgeNumbers()) {
				List<Question> byEge = questionRepository.findByEgeNumberAndIsDeletedFalse(egeNumber);
				if (!byEge.isEmpty()) {
					selectedQuestions.add(byEge.get((int) (Math.random() * byEge.size())));
				}
			}
		}

		if (request.getDifficultyDistribution() != null) {
			for (Map.Entry<TaskDifficulty, Integer> entry : request.getDifficultyDistribution().entrySet()) {
				TaskDifficulty difficulty = entry.getKey();
				int count = entry.getValue();

				List<Question> byDifficulty = questionRepository.findByDifficultyAndIsDeletedFalse(difficulty).stream()
						.filter(q -> !selectedQuestions.contains(q)).limit(count).collect(Collectors.toList());

				selectedQuestions.addAll(byDifficulty);
			}
		}

		if (selectedQuestions.size() < request.getQuestionCount()) {
			int needed = request.getQuestionCount() - selectedQuestions.size();
			List<Question> additional = questionRepository.findRandomQuestions(needed);
			selectedQuestions.addAll(additional);
		}

		if (request.getExcludeQuestionIds() != null) {
			selectedQuestions.removeIf(q -> request.getExcludeQuestionIds().contains(q.getId()));
		}

		if (request.isShuffleQuestions()) {
			Collections.shuffle(selectedQuestions);
		}

		List<Question> finalQuestions = selectedQuestions.size() > request.getQuestionCount()
				? selectedQuestions.subList(0, request.getQuestionCount())
				: selectedQuestions;

		StudyGroup group = studyGroupRepository.findById(request.getGroupId()).orElse(null);

		Assignment assignment = Assignment.builder().title(request.getTitle()).description(request.getDescription())
				.teacher(teacher).createdById(teacherId).group(group).questions(finalQuestions)
				.deadline(request.getDeadline()).timeLimitMinutes(request.getTimeLimitMinutes())
				.maxAttempts(request.getMaxAttempts()).status(AssignmentStatus.DRAFT)
				.showCorrectAnswers(request.isShowAnswersAfterCompletion())
				.showSolutions(request.isShowSolutionsAfterCompletion()).build();

		assignment = assignmentRepository.save(assignment);
		log.info("Generated assignment {} with {} questions", assignment.getId(), selectedQuestions.size());

		return mapToDto(assignment, false);
	}

	public AssignmentDto getById(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return mapToDto(assignment, true);
	}

	public List<AssignmentDto> getByTeacher(UUID teacherId) {
		return assignmentRepository.findByTeacherIdAndIsDeletedFalse(teacherId).stream().map(a -> mapToDto(a, false))
				.collect(Collectors.toList());
	}

	public List<AssignmentDto> getByGroup(UUID groupId) {
		return assignmentRepository.findByGroupIdOrderByDeadlineAsc(groupId).stream().map(a -> mapToDto(a, false))
				.collect(Collectors.toList());
	}

	public List<AssignmentDto> getActiveForStudent(UUID studentId) {
		return assignmentRepository.findActiveForStudent(studentId).stream().map(a -> mapToDto(a, false))
				.collect(Collectors.toList());
	}

	public List<AssignmentDto> getCompletedForStudent(UUID studentId) {
		return assignmentRepository.findCompletedAssignedForStudent(studentId).stream().map(a -> mapToDto(a, false))
				.collect(Collectors.toList());
	}

	@Transactional
	public AssignmentDto update(UUID assignmentId, AssignmentCreateRequest request) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setTitle(request.getTitle());
		assignment.setDescription(request.getDescription());
		assignment.setDeadline(request.getDeadline());

		if (request.getGroupId() != null) {
			StudyGroup group = studyGroupRepository.findById(request.getGroupId()).orElse(null);
			assignment.setGroup(group);
			assignment.setStudent(null);
		} else if (request.getStudentId() != null) {
			User student = userRepository.findById(request.getStudentId()).orElse(null);
			assignment.setStudent(student);
			assignment.setGroup(null);
		} else if (!request.isTemplate()) {
			assignment.setGroup(null);
			assignment.setStudent(null);
		}

		assignment.setIsTemplate(request.isTemplate());

		if (request.getQuestionIds() != null) {
			List<Question> rawQuestions = questionRepository
					.findAllById(request.getQuestionIds().stream().map(UUID::fromString).collect(Collectors.toList()));
			List<Question> questions = new ArrayList<>();
			for (String qId : request.getQuestionIds()) {
				UUID uuid = UUID.fromString(qId);
				rawQuestions.stream().filter(q -> q.getId().equals(uuid)).findFirst().ifPresent(questions::add);
			}
			assignment.setQuestions(questions);

			List<EgeTask> egeTasks = new ArrayList<>(egeTaskRepository.findAllById(request.getQuestionIds()));
			assignment.setEgeTasks(egeTasks);
		}

		assignment = assignmentRepository.save(assignment);
		return mapToDto(assignment, true);
	}

	@Transactional
	public AssignmentDto publishFromTemplate(UUID templateId, ru.stopro.dto.assignment.PublishTemplateRequest request) {
		Assignment template = assignmentRepository.findById(templateId)
				.orElseThrow(() -> new RuntimeException("Шаблон не найден"));

		if (!template.getIsTemplate()) {
			throw new RuntimeException("Это не шаблон");
		}

		StudyGroup group = null;
		User student = null;

		if (request.getGroupId() != null) {
			group = studyGroupRepository.findById(request.getGroupId())
					.orElseThrow(() -> new RuntimeException("Группа не найдена"));
		} else if (request.getStudentId() != null) {
			student = userRepository.findById(request.getStudentId())
					.orElseThrow(() -> new RuntimeException("Ученик не найден"));
		} else {
			throw new RuntimeException("Необходимо указать группу или ученика");
		}

		if (request.getDeadline() == null) {
			throw new RuntimeException("Дедлайн обязателен для публикации задания");
		}

		Assignment assignment = Assignment.builder().title(template.getTitle()).description(template.getDescription())
				.teacher(template.getTeacher()).createdById(template.getCreatedById()).group(group).student(student)
				.questions(new ArrayList<>(template.getQuestions())).egeTasks(new ArrayList<>(template.getEgeTasks()))
				.deadline(request.getDeadline()).isTemplate(false).timeLimitMinutes(template.getTimeLimitMinutes())
				.maxAttempts(template.getMaxAttempts()).status(AssignmentStatus.PUBLISHED)
				.showCorrectAnswers(template.getShowCorrectAnswers()).showSolutions(template.getShowSolutions())
				.templateId(templateId).publishedAt(LocalDateTime.now()).build();

		assignment = assignmentRepository.save(assignment);
		log.info("Published assignment {} from template {} by teacher {}", assignment.getId(), templateId,
				template.getTeacher().getId());

		return mapToDto(assignment, false);
	}

	@Transactional
	public AssignmentDto publish(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setStatus(AssignmentStatus.PUBLISHED);
		assignment.setPublishedAt(LocalDateTime.now());

		assignment = assignmentRepository.save(assignment);
		log.info("Published assignment {}", assignmentId);

		return mapToDto(assignment, false);
	}

	@Transactional
	public AssignmentSubmissionResultDto completeByStudent(UUID assignmentId, UUID studentId,
			Map<String, String> submittedAnswers) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("Student not found"));

		boolean allowed = false;
		if (assignment.getStudent() != null && assignment.getStudent().getId().equals(studentId)) {
			allowed = true;
		}
		if (!allowed && assignment.getGroup() != null && assignment.getGroup().getStudents() != null) {
			allowed = assignment.getGroup().getStudents().stream().anyMatch(s -> s.getId().equals(studentId));
		}

		if (!allowed) {
			throw new RuntimeException("Это задание не назначено текущему ученику");
		}

		if (Boolean.TRUE.equals(assignment.getIsTemplate())) {
			throw new RuntimeException("Нельзя сдать шаблон");
		}

		Map<String, String> answers = submittedAnswers != null ? submittedAnswers : new HashMap<>();
		List<AssignmentSubmissionResultDto.QuestionResult> results = new ArrayList<>();
		LocalDateTime now = LocalDateTime.now();
		int totalQuestions = 0;
		int answeredQuestions = 0;
		int correctAnswers = 0;

		if (assignment.getQuestions() != null && !assignment.getQuestions().isEmpty()) {
			int index = 1;
			for (Question question : assignment.getQuestions()) {
				String key = question.getId().toString();
				String rawAnswer = answers.get(key);
				String userAnswer = rawAnswer != null ? rawAnswer.trim() : "";
				boolean hasAnswer = !userAnswer.isBlank();
				boolean isCorrect = hasAnswer && question.checkAnswer(userAnswer);

				if (hasAnswer) {
					answeredQuestions++;
				}
				if (isCorrect) {
					correctAnswers++;
				}
				totalQuestions++;

				Attempt attempt = Attempt.builder().student(student).assignment(assignment).question(question)
						.userAnswer(userAnswer).normalizedAnswer(normalizeAnswer(userAnswer)).isCorrect(isCorrect)
						.pointsEarned(isCorrect ? defaultPoints(question.getPoints()) : 0)
						.maxPoints(defaultPoints(question.getPoints())).startedAt(now).answeredAt(now).checkedAt(now)
						.status(AttemptStatus.CHECKED).isManuallyChecked(false).build();
				attemptRepository.save(attempt);

				results.add(AssignmentSubmissionResultDto.QuestionResult.builder().questionId(key).index(index)
						.egeNumber(question.getEgeNumber())
						.topicName(question.getTopic() != null ? question.getTopic().getName() : null)
						.content(question.getContent()).userAnswer(userAnswer).isCorrect(isCorrect)
						.correctAnswer(question.getAnswer()).solution(question.getSolution()).build());
				index++;
			}
		} else {
			int index = 1;
			for (EgeTask task : assignment.getEgeTasks()) {
				String key = task.getId();
				String rawAnswer = answers.get(key);
				String userAnswer = rawAnswer != null ? rawAnswer.trim() : "";
				boolean hasAnswer = !userAnswer.isBlank();
				boolean isCorrect = hasAnswer && isShortAnswerCorrect(userAnswer, task.getAnswer());

				if (hasAnswer) {
					answeredQuestions++;
				}
				if (isCorrect) {
					correctAnswers++;
				}
				totalQuestions++;

				results.add(AssignmentSubmissionResultDto.QuestionResult.builder().questionId(key).index(index)
						.egeNumber(task.getEgeNumber()).topicName(task.getTopic()).content(task.getContent())
						.userAnswer(userAnswer).isCorrect(isCorrect).correctAnswer(task.getAnswer())
						.solution(task.getSolution()).build());
				index++;
			}
		}

		if (assignment.getStatus() == AssignmentStatus.COMPLETED) {
			var existingSubmission = studentAssignmentSubmissionRepository
					.findTopByAssignment_IdAndStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(assignmentId,
							studentId);
			if (existingSubmission.isPresent()) {
				return toSubmissionResultDto(existingSubmission.get());
			}

			int scorePercentFallback = totalQuestions > 0
					? (int) Math.round(correctAnswers * 100.0 / totalQuestions)
					: 0;
			return AssignmentSubmissionResultDto.builder().assignmentId(assignment.getId())
					.assignmentTitle(assignment.getTitle()).status(assignment.getStatus().name()).submittedAt(now)
					.totalQuestions(totalQuestions).answeredQuestions(answeredQuestions).correctAnswers(correctAnswers)
					.scorePercent(scorePercentFallback).questionResults(results).build();
		}

		assignment.setCompletedCount((assignment.getCompletedCount() != null ? assignment.getCompletedCount() : 0) + 1);
		assignment.setStatus(AssignmentStatus.COMPLETED);
		int scorePercent = totalQuestions > 0 ? (int) Math.round(correctAnswers * 100.0 / totalQuestions) : 0;
		double currentAverage = assignment.getAverageScore() != null ? assignment.getAverageScore() : scorePercent;
		if (assignment.getAverageScore() != null && assignment.getCompletedCount() != null
				&& assignment.getCompletedCount() > 1) {
			currentAverage = ((assignment.getAverageScore() * (assignment.getCompletedCount() - 1)) + scorePercent)
					/ assignment.getCompletedCount();
		}
		assignment.setAverageScore(currentAverage);
		assignment = assignmentRepository.save(assignment);

		StudentAssignmentSubmission submission = StudentAssignmentSubmission.builder().assignment(assignment)
				.student(student).submittedAt(now).totalQuestions(totalQuestions).answeredQuestions(answeredQuestions)
				.correctAnswers(correctAnswers).scorePercent(scorePercent).build();

		List<StudentAssignmentAnswerResult> answerEntities = results.stream()
				.map(result -> StudentAssignmentAnswerResult.builder().submission(submission)
						.questionRefId(result.getQuestionId()).questionIndex(result.getIndex())
						.egeNumber(result.getEgeNumber()).topicName(result.getTopicName()).content(result.getContent())
						.userAnswer(result.getUserAnswer()).isCorrect(Boolean.TRUE.equals(result.getIsCorrect()))
						.correctAnswer(result.getCorrectAnswer()).solution(result.getSolution()).build())
				.collect(Collectors.toList());
		submission.setAnswers(answerEntities);
		studentAssignmentSubmissionRepository.save(submission);

		log.info("Student {} completed assignment {}", student.getId(), assignmentId);
		return AssignmentSubmissionResultDto.builder().assignmentId(assignment.getId())
				.assignmentTitle(assignment.getTitle()).status(assignment.getStatus().name()).submittedAt(now)
				.totalQuestions(totalQuestions).answeredQuestions(answeredQuestions).correctAnswers(correctAnswers)
				.scorePercent(scorePercent).questionResults(results).build();
	}

	public AssignmentSubmissionResultDto getStudentSubmissionResult(UUID assignmentId, UUID studentId) {
		StudentAssignmentSubmission submission = studentAssignmentSubmissionRepository
				.findTopByAssignment_IdAndStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(assignmentId, studentId)
				.orElseThrow(() -> new RuntimeException("Результат сдачи не найден"));

		return toSubmissionResultDto(submission);
	}

	private boolean isShortAnswerCorrect(String userAnswer, String correctAnswer) {
		if (correctAnswer == null) {
			return false;
		}

		String normalizedUser = normalizeAnswer(userAnswer);
		String normalizedCorrect = normalizeAnswer(correctAnswer);

		if (Objects.equals(normalizedUser, normalizedCorrect)) {
			return true;
		}

		try {
			double user = Double.parseDouble(normalizedUser);
			double correct = Double.parseDouble(normalizedCorrect);
			return Math.abs(user - correct) < 0.001;
		} catch (NumberFormatException ignored) {
			return false;
		}
	}

	private String normalizeAnswer(String answer) {
		if (answer == null) {
			return "";
		}

		return answer.trim().toLowerCase().replaceAll("\\s+", "").replace(",", ".").replace("−", "-").replace("–", "-")
				.replaceAll("\\.0+$", "").replaceAll("\\+$", "");
	}

	private int defaultPoints(Integer points) {
		return points != null && points > 0 ? points : 1;
	}

	private AssignmentSubmissionResultDto toSubmissionResultDto(StudentAssignmentSubmission submission) {
		List<AssignmentSubmissionResultDto.QuestionResult> questionResults = submission.getAnswers().stream()
				.sorted(java.util.Comparator.comparing(StudentAssignmentAnswerResult::getQuestionIndex))
				.map(answer -> AssignmentSubmissionResultDto.QuestionResult.builder()
						.questionId(answer.getQuestionRefId()).index(answer.getQuestionIndex())
						.egeNumber(answer.getEgeNumber()).topicName(answer.getTopicName()).content(answer.getContent())
						.userAnswer(answer.getUserAnswer()).isCorrect(answer.getIsCorrect())
						.correctAnswer(answer.getCorrectAnswer()).solution(answer.getSolution()).build())
				.collect(Collectors.toList());

		return AssignmentSubmissionResultDto.builder().assignmentId(submission.getAssignment().getId())
				.assignmentTitle(submission.getAssignment().getTitle())
				.status(submission.getAssignment().getStatus().name()).submittedAt(submission.getSubmittedAt())
				.totalQuestions(submission.getTotalQuestions()).answeredQuestions(submission.getAnsweredQuestions())
				.correctAnswers(submission.getCorrectAnswers()).scorePercent(submission.getScorePercent())
				.questionResults(questionResults).build();
	}

	@Transactional
	public AssignmentDto archive(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setStatus(AssignmentStatus.ARCHIVED);
		assignment = assignmentRepository.save(assignment);

		return mapToDto(assignment, false);
	}

	@Transactional
	public AssignmentDto duplicate(UUID assignmentId, UUID newGroupId, LocalDateTime newDeadline) {
		Assignment original = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		StudyGroup newGroup = newGroupId != null
				? studyGroupRepository.findById(newGroupId).orElse(original.getGroup())
				: original.getGroup();

		Assignment copy = Assignment.builder().title(original.getTitle() + " (копия)")
				.description(original.getDescription()).teacher(original.getTeacher())
				.createdById(original.getCreatedById()).group(newGroup)
				.questions(new ArrayList<>(original.getQuestions()))
				.deadline(newDeadline != null ? newDeadline : original.getDeadline().plusDays(7))
				.timeLimitMinutes(original.getTimeLimitMinutes()).maxAttempts(original.getMaxAttempts())
				.status(AssignmentStatus.DRAFT).showCorrectAnswers(original.isShowAnswersAfterCompletion())
				.showSolutions(original.isShowSolutionsAfterCompletion()).build();

		copy = assignmentRepository.save(copy);
		return mapToDto(copy, false);
	}

	@Transactional
	public AssignmentDto extendDeadline(UUID assignmentId, LocalDateTime newDeadline) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setDeadline(newDeadline);
		assignment = assignmentRepository.save(assignment);

		log.info("Extended deadline for assignment {} to {}", assignmentId, newDeadline);
		return mapToDto(assignment, false);
	}

	public AssignmentDto getStatistics(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		AssignmentDto dto = mapToDto(assignment, false);
		dto.setCompletedCount(10);
		dto.setAverageScore(75.5);

		return dto;
	}

	@Transactional
	public void delete(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		assignment.setIsDeleted(true);
		assignmentRepository.save(assignment);
		log.info("Deleted assignment {}", assignmentId);
	}

	private AssignmentDto mapToDto(Assignment assignment, boolean includeQuestions) {

		AssignmentDto dto = AssignmentDto.fromEntity(assignment, includeQuestions);

		if (assignment.getStudent() != null) {
			dto.setStudentId(assignment.getStudent().getId());
			dto.setStudentName(assignment.getStudent().getFullName());
		}

		dto.setQuestionsCount(assignment.getQuestionsCount());

		return dto;
	}

}