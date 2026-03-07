package ru.stopro.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.entity.Question;
import ru.stopro.domain.entity.StudyGroup;
import ru.stopro.domain.enums.AssignmentStatus;
import ru.stopro.domain.enums.TaskDifficulty;
import ru.stopro.dto.assignment.AssignmentCreateRequest;
import ru.stopro.dto.assignment.AssignmentDto;
import ru.stopro.dto.assignment.GenerateAssignmentRequest;
import ru.stopro.repository.AssignmentRepository;
import ru.stopro.repository.QuestionRepository;
import ru.stopro.repository.StudyGroupRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssignmentService {

	private final AssignmentRepository assignmentRepository;
	private final QuestionRepository questionRepository;
	private final StudyGroupRepository studyGroupRepository;

	/**
	 * Создать тест вручную из выбранных задач
	 */
	@Transactional
	public AssignmentDto create(UUID teacherId, AssignmentCreateRequest request) {
		StudyGroup group = null;
		if (request.getGroupId() != null) {
			group = studyGroupRepository.findById(request.getGroupId()).orElse(null);
		}

		List<Question> questions = questionRepository.findAllById(request.getQuestionIds());

		Assignment assignment = Assignment.builder().title(request.getTitle()).description(request.getDescription())
				.createdById(teacherId).group(group).questions(questions).deadline(request.getDeadline())
				.timeLimitMinutes(request.getTimeLimitMinutes()).maxAttempts(request.getMaxAttempts())
				.status(AssignmentStatus.DRAFT).showCorrectAnswers(request.isShowAnswersAfterCompletion())
				.showSolutions(request.isShowSolutionsAfterCompletion()).build();

		assignment = assignmentRepository.save(assignment);
		log.info("Created assignment {} by teacher {}", assignment.getId(), teacherId);

		return mapToDto(assignment);
	}

	/**
	 * Автоматическая генерация теста по критериям
	 */
	@Transactional
	public AssignmentDto generate(UUID teacherId, GenerateAssignmentRequest request) {
		log.info("Generating assignment for teacher {} with {} questions", teacherId, request.getQuestionCount());

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
				.createdById(teacherId).group(group).questions(finalQuestions).deadline(request.getDeadline())
				.timeLimitMinutes(request.getTimeLimitMinutes()).maxAttempts(request.getMaxAttempts())
				.status(AssignmentStatus.DRAFT).showCorrectAnswers(request.isShowAnswersAfterCompletion())
				.showSolutions(request.isShowSolutionsAfterCompletion()).build();

		assignment = assignmentRepository.save(assignment);
		log.info("Generated assignment {} with {} questions", assignment.getId(), selectedQuestions.size());

		return mapToDto(assignment);
	}

	/**
	 * Получить тест по ID
	 */
	public AssignmentDto getById(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));
		return mapToDto(assignment);
	}

	/**
	 * Получить тесты учителя
	 */
	public List<AssignmentDto> getByTeacher(UUID teacherId) {
		return assignmentRepository.findByCreatedByIdOrderByCreatedAtDesc(teacherId).stream().map(this::mapToDto)
				.collect(Collectors.toList());
	}

	/**
	 * Получить тесты группы
	 */
	public List<AssignmentDto> getByGroup(UUID groupId) {
		return assignmentRepository.findByGroupIdOrderByDeadlineAsc(groupId).stream().map(this::mapToDto)
				.collect(Collectors.toList());
	}

	/**
	 * Опубликовать тест
	 */
	@Transactional
	public AssignmentDto publish(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setStatus(AssignmentStatus.ACTIVE);
		assignment.setPublishedAt(LocalDateTime.now());

		assignment = assignmentRepository.save(assignment);
		log.info("Published assignment {}", assignmentId);

		return mapToDto(assignment);
	}

	/**
	 * Архивировать тест
	 */
	@Transactional
	public AssignmentDto archive(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setStatus(AssignmentStatus.ARCHIVED);
		assignment = assignmentRepository.save(assignment);

		return mapToDto(assignment);
	}

	/**
	 * Дублировать тест
	 */
	@Transactional
	public AssignmentDto duplicate(UUID assignmentId, UUID newGroupId, LocalDateTime newDeadline) {
		Assignment original = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		StudyGroup newGroup = newGroupId != null
				? studyGroupRepository.findById(newGroupId).orElse(original.getGroup())
				: original.getGroup();

		Assignment copy = Assignment.builder().title(original.getTitle() + " (копия)")
				.description(original.getDescription()).createdById(original.getCreatedById()).group(newGroup)
				.questions(new ArrayList<>(original.getQuestions()))
				.deadline(newDeadline != null ? newDeadline : original.getDeadline().plusDays(7))
				.timeLimitMinutes(original.getTimeLimitMinutes()).maxAttempts(original.getMaxAttempts())
				.status(AssignmentStatus.DRAFT).showCorrectAnswers(original.isShowAnswersAfterCompletion())
				.showSolutions(original.isShowSolutionsAfterCompletion()).build();

		copy = assignmentRepository.save(copy);
		return mapToDto(copy);
	}

	/**
	 * Продлить дедлайн
	 */
	@Transactional
	public AssignmentDto extendDeadline(UUID assignmentId, LocalDateTime newDeadline) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		assignment.setDeadline(newDeadline);
		assignment = assignmentRepository.save(assignment);

		log.info("Extended deadline for assignment {} to {}", assignmentId, newDeadline);
		return mapToDto(assignment);
	}

	/**
	 * Получить статистику по тесту
	 */
	public AssignmentDto getStatistics(UUID assignmentId) {
		Assignment assignment = assignmentRepository.findById(assignmentId)
				.orElseThrow(() -> new RuntimeException("Assignment not found"));

		// TODO: В реальности здесь считаем статистику из attemptRepository
		AssignmentDto dto = mapToDto(assignment);
		dto.setCompletedCount(10);
		dto.setAverageScore(75.5);

		return dto;
	}

	private AssignmentDto mapToDto(Assignment assignment) {
		return AssignmentDto.builder().id(assignment.getId()).title(assignment.getTitle())
				.description(assignment.getDescription())
				.groupId(assignment.getGroup() != null ? assignment.getGroup().getId() : null)
				.groupName(assignment.getGroup() != null ? assignment.getGroup().getName() : null)
				.questionsCount(assignment.getQuestions() != null ? assignment.getQuestions().size() : 0)
				.deadline(assignment.getDeadline()).timeLimitMinutes(assignment.getTimeLimitMinutes())
				.maxAttempts(assignment.getMaxAttempts()).status(assignment.getStatus())
				.showCorrectAnswers(assignment.isShowAnswersAfterCompletion())
				.showSolutions(assignment.isShowSolutionsAfterCompletion()).createdAt(assignment.getCreatedAt())
				.publishedAt(assignment.getPublishedAt()).build();
	}
}
