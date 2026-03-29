package ru.stopro.domain.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

import ru.stopro.domain.enums.QuestionType;
import ru.stopro.domain.enums.TaskDifficulty;
import ru.stopro.domain.enums.TaskSource;

/**
 * Сущность Question - авторская база задач с поддержкой LaTeX
 * 
 * Это главная сущность для хранения математических задач. Поддерживает: - LaTeX
 * разметку в условии и решении - Различные типы ответов (число, выражение,
 * множественный выбор) - Иерархию тем - Версионирование
 */
@Entity
@Table(name = "questions", indexes = {@Index(name = "idx_question_topic", columnList = "topic_id"),
		@Index(name = "idx_question_ege_number", columnList = "ege_number"),
		@Index(name = "idx_question_difficulty", columnList = "difficulty"),
		@Index(name = "idx_question_source", columnList = "source"),
		@Index(name = "idx_question_type", columnList = "question_type"),
		@Index(name = "idx_question_active", columnList = "is_active, is_deleted"),
		@Index(name = "idx_question_author", columnList = "author_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "topic_id", nullable = false)
	private Topic topic;

	@Column(name = "ege_number", nullable = false)
	private Integer egeNumber;

	@Enumerated(EnumType.STRING)
	@Column(name = "difficulty", nullable = false, length = 20)
	@Builder.Default
	private TaskDifficulty difficulty = TaskDifficulty.MEDIUM;

	@Enumerated(EnumType.STRING)
	@Column(name = "question_type", nullable = false, length = 30)
	@Builder.Default
	private QuestionType questionType = QuestionType.SHORT_ANSWER;

	/**
	 * Условие задачи Поддерживает LaTeX: $$x^2 + 2x + 1 = 0$$ Также поддерживает
	 * inline LaTeX: $x = \frac{-b \pm \sqrt{D}}{2a}$
	 */
	@Column(name = "content", nullable = false, columnDefinition = "TEXT")
	private String content;

	/**
	 * Условие в формате plain text (без LaTeX) Используется для поиска и индексации
	 */
	@Column(name = "content_plain", columnDefinition = "TEXT")
	private String contentPlain;

	/**
	 * Правильный ответ Может содержать: - Число: "42", "3.14", "-5" - Выражение:
	 * "2*sqrt(3)", "pi/6" - Множество: "{1, 2, 3}" - Интервал: "(-inf, 2) ∪ (3,
	 * +inf)"
	 */
	@Column(name = "answer", nullable = false, length = 1000)
	private String answer;

	/**
	 * Получить правильный ответ (для совместимости)
	 */
	@Transient
	public String getCorrectAnswer() {
		return answer;
	}

	/**
	 * Получить тип вопроса (для совместимости)
	 */
	@Transient
	public QuestionType getType() {
		return questionType;
	}

	/**
	 * Получить варианты ответов (для совместимости)
	 */
	@Transient
	public List<String> getAnswerOptions() {
		return new ArrayList<>();
	}

	/**
	 * Получить изображения (для совместимости)
	 */
	@Transient
	public List<String> getImages() {
		List<String> images = new ArrayList<>();
		if (imageUrl != null) {
			images.add(imageUrl);
		}
		return images;
	}

	/**
	 * Является ли вопрос публичным (для совместимости)
	 */
	@Transient
	public Boolean getIsPublic() {
		return isActive && !getIsDeleted();
	}

	/**
	 * Количество использований (для совместимости)
	 */
	@Transient
	public Integer getUsageCount() {
		return timesAttempted;
	}

	/**
	 * Альтернативные формы правильного ответа JSON массив: ["0.5", "1/2", "0,5"]
	 */
	@Column(name = "alternative_answers", columnDefinition = "TEXT")
	private String alternativeAnswers;

	/**
	 * Развёрнутое решение с LaTeX
	 */
	@Column(name = "solution", columnDefinition = "TEXT")
	private String solution;

	/**
	 * Пошаговое решение в JSON формате [{"step": 1, "text": "...", "latex": "..."}]
	 */
	@Column(name = "step_by_step_solution", columnDefinition = "TEXT")
	private String stepByStepSolution;

	/**
	 * Подсказка для ученика
	 */
	@Column(name = "hint", columnDefinition = "TEXT")
	private String hint;

	/**
	 * Типичные ошибки при решении JSON: [{"type": "SIGN_ERROR", "description":
	 * "..."}]
	 */
	@Column(name = "common_mistakes", columnDefinition = "TEXT")
	private String commonMistakes;

	@Column(name = "image_url", length = 500)
	private String imageUrl;

	/**
	 * Дополнительные изображения (JSON массив URL)
	 */
	@Column(name = "additional_images", columnDefinition = "TEXT")
	private String additionalImages;

	/**
	 * SVG-диаграмма для геометрических задач
	 */
	@Column(name = "diagram_svg", columnDefinition = "TEXT")
	private String diagramSvg;

	/**
	 * GeoGebra applet ID для интерактивных задач
	 */
	@Column(name = "geogebra_id", length = 100)
	private String geogebraId;

	@Column(name = "points", nullable = false)
	@Builder.Default
	private Integer points = 1;

	@Column(name = "estimated_time_minutes")
	@Builder.Default
	private Integer estimatedTimeMinutes = 5;

	@Enumerated(EnumType.STRING)
	@Column(name = "source", length = 50)
	@Builder.Default
	private TaskSource source = TaskSource.BANK;

	@Column(name = "source_year")
	private Integer sourceYear;

	@Column(name = "source_variant")
	private Integer sourceVariant;

	@Column(name = "source_url", length = 500)
	private String sourceUrl;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "author_id")
	private User author;

	@Column(name = "is_verified", nullable = false)
	@Builder.Default
	private Boolean isVerified = false;

	@Column(name = "verified_by_id")
	private UUID verifiedById;

	@Column(name = "verified_at")
	private java.time.LocalDateTime verifiedAt;

	@Column(name = "times_shown", nullable = false)
	@Builder.Default
	private Integer timesShown = 0;

	@Column(name = "times_attempted", nullable = false)
	@Builder.Default
	private Integer timesAttempted = 0;

	@Column(name = "times_correct", nullable = false)
	@Builder.Default
	private Integer timesCorrect = 0;

	@Column(name = "average_time_seconds")
	private Integer averageTimeSeconds;

	@Column(name = "average_attempts")
	private Double averageAttempts;

	/**
	 * Теги для поиска и фильтрации JSON массив: ["тригонометрия", "синус",
	 * "уравнение"]
	 */
	@Column(name = "tags", columnDefinition = "TEXT")
	private String tags;

	/**
	 * Ключевые слова для поиска
	 */
	@Column(name = "keywords", columnDefinition = "TEXT")
	private String keywords;

	/**
	 * Требуемые знания (prerequisites) JSON: ["формулы приведения", "основное
	 * тригонометрическое тождество"]
	 */
	@Column(name = "prerequisites", columnDefinition = "TEXT")
	private String prerequisites;

	@Column(name = "question_version", nullable = false)
	@Builder.Default
	private Integer questionVersion = 1;

	@Column(name = "parent_question_id")
	private UUID parentQuestionId;

	@Column(name = "is_latest_version", nullable = false)
	@Builder.Default
	private Boolean isLatestVersion = true;

	@Column(name = "is_active", nullable = false)
	@Builder.Default
	private Boolean isActive = true;

	@Column(name = "is_premium", nullable = false)
	@Builder.Default
	private Boolean isPremium = false;

	@Column(name = "review_notes", columnDefinition = "TEXT")
	private String reviewNotes;

	@OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
	@Builder.Default
	private List<Attempt> attempts = new ArrayList<>();

	@ManyToMany(mappedBy = "questions")
	@Builder.Default
	private List<Assignment> assignments = new ArrayList<>();

	@Transient
	public double getSuccessRate() {
		if (timesAttempted == 0) {
			return 0.0;
		}
		return (double) timesCorrect / timesAttempted * 100;
	}

	@Transient
	public String getDifficultyLabel() {
		return switch (difficulty) {
			case EASY -> "Лёгкая";
			case MEDIUM -> "Средняя";
			case HARD -> "Сложная";
		};
	}

	/**
	 * Проверяет правильность ответа Поддерживает различные форматы записи
	 */
	public boolean checkAnswer(String userAnswer) {
		if (userAnswer == null || userAnswer.isBlank()) {
			return false;
		}

		String normalized = normalizeAnswer(userAnswer);
		String correctNormalized = normalizeAnswer(answer);

		if (normalized.equals(correctNormalized)) {
			return true;
		}

		if (alternativeAnswers != null && !alternativeAnswers.isBlank()) {
			String[] alternatives = alternativeAnswers.replace("[", "").replace("]", "").replace("\"", "").split(",");

			for (String alt : alternatives) {
				if (normalizeAnswer(alt.trim()).equals(normalized)) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Нормализует ответ для сравнения
	 */
	private String normalizeAnswer(String answer) {
		return answer.trim().toLowerCase().replaceAll("\\s+", "").replace(",", ".").replace("−", "-").replace("–", "-")
				.replaceAll("\\.0+$", "").replaceAll("\\+$", "");
	}

	/**
	 * Обновляет статистику после попытки решения
	 */
	public void recordAttempt(boolean isCorrect, int timeSeconds) {
		timesAttempted++;
		if (isCorrect) {
			timesCorrect++;
		}

		if (averageTimeSeconds == null) {
			averageTimeSeconds = timeSeconds;
		} else {
			averageTimeSeconds = (averageTimeSeconds * (timesAttempted - 1) + timeSeconds) / timesAttempted;
		}
	}

	/**
	 * Создаёт новую версию задачи
	 */
	public Question createNewVersion() {
		return Question.builder().topic(this.topic).egeNumber(this.egeNumber).difficulty(this.difficulty)
				.questionType(this.questionType).content(this.content).contentPlain(this.contentPlain)
				.answer(this.answer).alternativeAnswers(this.alternativeAnswers).solution(this.solution).hint(this.hint)
				.imageUrl(this.imageUrl).points(this.points).estimatedTimeMinutes(this.estimatedTimeMinutes)
				.source(this.source).author(this.author).tags(this.tags).keywords(this.keywords)
				.questionVersion(this.questionVersion + 1).parentQuestionId(this.getId()).isLatestVersion(true).build();
	}
}
