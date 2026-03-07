package ru.stopro.service;

import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Question;
import ru.stopro.domain.entity.Topic;
import ru.stopro.dto.question.QuestionCreateRequest;
import ru.stopro.dto.question.QuestionDto;
import ru.stopro.dto.question.QuestionFilterRequest;
import ru.stopro.repository.QuestionRepository;
import ru.stopro.repository.TopicRepository;
import ru.stopro.repository.UserRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

	private final QuestionRepository questionRepository;
	private final TopicRepository topicRepository;
	private final UserRepository userRepository;

	private static final Pattern LATEX_PATTERN = Pattern.compile("\\$[^$]+\\$|\\$\\$[^$]+\\$\\$");

	/**
	 * Создать новую задачу
	 */
	@Transactional
	public QuestionDto create(UUID teacherId, QuestionCreateRequest request) {
		if (!validateLatex(request.getContent())) {
			throw new IllegalArgumentException("Некорректный LaTeX синтаксис");
		}

		Topic topic = null;
		if (request.getTopicId() != null) {
			topic = topicRepository.findById(request.getTopicId()).orElse(null);
		}

		Question question = Question.builder().content(request.getContent()).answer(request.getCorrectAnswer())
				.alternativeAnswers(request.getAlternativeAnswers() != null
						? String.join(",", request.getAlternativeAnswers())
						: null)
				.questionType(request.getType()).difficulty(request.getDifficulty()).topic(topic)
				.egeNumber(request.getEgeNumber()).solution(request.getSolution()).hint(request.getHint())
				.tags(request.getTags() != null ? String.join(",", request.getTags()) : null)
				.isActive(request.isPublic()).author(userRepository.findById(teacherId).orElse(null)).isVerified(false)
				.timesAttempted(0).timesCorrect(0).build();

		question = questionRepository.save(question);
		log.info("Created question {} by teacher {}", question.getId(), teacherId);

		return mapToDto(question);
	}

	/**
	 * Обновить задачу
	 */
	@Transactional
	public QuestionDto update(UUID questionId, QuestionCreateRequest request) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new RuntimeException("Question not found"));

		if (!validateLatex(request.getContent())) {
			throw new IllegalArgumentException("Некорректный LaTeX синтаксис");
		}

		question.setContent(request.getContent());
		question.setAnswer(request.getCorrectAnswer());

		if (request.getAlternativeAnswers() != null && !request.getAlternativeAnswers().isEmpty()) {
			question.setAlternativeAnswers(String.join(",", request.getAlternativeAnswers()));
		}
		question.setQuestionType(request.getType());
		question.setDifficulty(request.getDifficulty());
		question.setEgeNumber(request.getEgeNumber());
		question.setSolution(request.getSolution());
		question.setHint(request.getHint());

		if (request.getTags() != null && !request.getTags().isEmpty()) {
			question.setTags(String.join(",", request.getTags()));
		}

		if (request.getImages() != null && !request.getImages().isEmpty()) {
			question.setAdditionalImages(String.join(",", request.getImages()));
		}
		question.setIsActive(request.isPublic());

		question.setIsVerified(false);

		question = questionRepository.save(question);
		return mapToDto(question);
	}

	/**
	 * Удалить задачу (мягкое удаление)
	 */
	@Transactional
	public void delete(UUID questionId) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new RuntimeException("Question not found"));

		question.setIsDeleted(true);
		questionRepository.save(question);
		log.info("Deleted question {}", questionId);
	}

	/**
	 * Получить задачу по ID
	 */
	public QuestionDto getById(UUID questionId) {
		Question question = questionRepository.findById(questionId)
				.orElseThrow(() -> new RuntimeException("Question not found"));
		return mapToDto(question);
	}

	/**
	 * Получить задачи учителя
	 */
	public Page<QuestionDto> getByTeacher(UUID teacherId, Pageable pageable) {
		return questionRepository.findByAuthorIdAndIsDeletedFalse(teacherId, pageable).map(this::mapToDto);
	}

	/**
	 * Поиск с фильтрами
	 */
	public Page<QuestionDto> search(QuestionFilterRequest filter, Pageable pageable) {
		if (filter.getTopicId() != null) {
			return questionRepository.findByTopicIdAndIsDeletedFalse(filter.getTopicId(), pageable).map(this::mapToDto);
		}

		if (filter.getDifficulty() != null) {
			return questionRepository.findByDifficultyAndIsDeletedFalse(filter.getDifficulty(), pageable)
					.map(this::mapToDto);
		}

		return questionRepository.findByIsDeletedFalse(pageable).map(this::mapToDto);
	}

	/**
	 * Дублировать задачу
	 */
	@Transactional
	public QuestionDto duplicate(UUID questionId, UUID teacherId) {
		Question original = questionRepository.findById(questionId)
				.orElseThrow(() -> new RuntimeException("Question not found"));

		Question copy = Question.builder().content(original.getContent()).answer(original.getAnswer())
				.alternativeAnswers(original.getAlternativeAnswers()).questionType(original.getQuestionType())
				.difficulty(original.getDifficulty()).topic(original.getTopic()).egeNumber(original.getEgeNumber())
				.solution(original.getSolution()).hint(original.getHint()).tags(original.getTags()).isActive(false)
				.author(userRepository.findById(teacherId).orElse(null)).isVerified(false).timesAttempted(0)
				.timesCorrect(0).build();

		copy = questionRepository.save(copy);
		log.info("Duplicated question {} to {} by teacher {}", questionId, copy.getId(), teacherId);

		return mapToDto(copy);
	}

	/**
	 * Импорт из публичного банка
	 */
	@Transactional
	public List<QuestionDto> importFromBank(UUID teacherId, List<UUID> questionIds) {
		return questionIds.stream().map(id -> duplicate(id, teacherId)).collect(Collectors.toList());
	}

	/**
	 * Валидация LaTeX
	 */
	public boolean validateLatex(String content) {
		if (content == null)
			return false;

		long singleDollarCount = content.chars().filter(ch -> ch == '$').count();

		return singleDollarCount % 2 == 0;
	}

	/**
	 * Получить публичный банк задач
	 */
	public Page<QuestionDto> getPublicBank(Pageable pageable) {
		return questionRepository.findByIsActiveTrueAndIsDeletedFalse(pageable).map(this::mapToDto);
	}

	private QuestionDto mapToDto(Question question) {
		return QuestionDto.builder().id(question.getId()).content(question.getContent()).answer(question.getAnswer())
				.questionType(question.getQuestionType()).difficulty(question.getDifficulty())
				.topicId(question.getTopic() != null ? question.getTopic().getId() : null)
				.topicName(question.getTopic() != null ? question.getTopic().getName() : null)
				.egeNumber(question.getEgeNumber()).solution(question.getSolution()).hint(question.getHint())
				.tags(question.getTags()).isVerified(question.getIsVerified())
				.timesAttempted(question.getTimesAttempted()).successRate(question.getSuccessRate())
				.createdAt(question.getCreatedAt()).build();
	}
}
