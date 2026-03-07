package ru.stopro.domain.entity;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

import ru.stopro.domain.enums.AttemptStatus;

/**
 * Сущность Attempt - результаты прорешивания заданий
 * 
 * Хранит полную информацию о попытке прохождения Assignment: - Все ответы
 * ученика - Время на каждый вопрос - Результаты проверки - AI-анализ (если
 * применимо)
 */
@Entity
@Table(name = "attempts", indexes = {@Index(name = "idx_attempt_student", columnList = "student_id"),
		@Index(name = "idx_attempt_assignment", columnList = "assignment_id"),
		@Index(name = "idx_attempt_question", columnList = "question_id"),
		@Index(name = "idx_attempt_status", columnList = "status"),
		@Index(name = "idx_attempt_started", columnList = "started_at"),
		@Index(name = "idx_attempt_student_assignment", columnList = "student_id, assignment_id"),
		@Index(name = "idx_attempt_student_question", columnList = "student_id, question_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Attempt extends BaseEntity {
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	/**
	 * ID студента (для совместимости)
	 */
	@Transient
	public UUID getStudentId() {
		return student != null ? student.getId() : null;
	}

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assignment_id")
	private Assignment assignment;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "question_id", nullable = false)
	private Question question;

	/**
	 * Ответ ученика
	 */
	@Column(name = "user_answer", columnDefinition = "TEXT")
	private String userAnswer;

	/**
	 * Ответ в нормализованном виде
	 */
	@Column(name = "normalized_answer", length = 1000)
	private String normalizedAnswer;

	/**
	 * Результат проверки
	 */
	@Column(name = "is_correct")
	private Boolean isCorrect;

	/**
	 * Частичная правильность (для задач с несколькими частями) От 0.0 до 1.0
	 */
	@Column(name = "partial_score")
	private Double partialScore;

	/**
	 * Баллы, полученные за этот ответ
	 */
	@Column(name = "points_earned", nullable = false)
	@Builder.Default
	private Integer pointsEarned = 0;

	/**
	 * Максимально возможные баллы
	 */
	@Column(name = "max_points", nullable = false)
	@Builder.Default
	private Integer maxPoints = 1;

	/**
	 * Начало попытки
	 */
	@Column(name = "started_at", nullable = false)
	@Builder.Default
	private LocalDateTime startedAt = LocalDateTime.now();

	/**
	 * Время ответа
	 */
	@Column(name = "answered_at")
	private LocalDateTime answeredAt;

	/**
	 * Завершение проверки
	 */
	@Column(name = "checked_at")
	private LocalDateTime checkedAt;

	/**
	 * Время, потраченное на вопрос (в секундах)
	 */
	@Column(name = "time_spent_seconds")
	private Integer timeSpentSeconds;

	/**
	 * Ответы (JSON массив для совместимости)
	 */
	@Column(name = "answers", columnDefinition = "TEXT")
	private String answers;

	/**
	 * Установить ответы из строки (для совместимости)
	 */
	public void setAnswers(String answers) {
		this.answers = answers;
	}

	/**
	 * Количество правильных ответов (для совместимости)
	 */
	@Column(name = "correct_count")
	private Integer correctCount;

	/**
	 * Общее количество вопросов (для совместимости)
	 */
	@Column(name = "total_questions")
	private Integer totalQuestions;

	/**
	 * Балл (для совместимости)
	 */
	@Column(name = "score")
	private Double score;

	/**
	 * Время завершения (для совместимости)
	 */
	@Column(name = "finished_at")
	private LocalDateTime finishedAt;

	/**
	 * Получить ответы как Map (для совместимости)
	 */
	@Transient
	public Map<String, Object> getAnswers() {
		// В реальности это JSON парсинг
		return new HashMap<>();
	}

	/**
	 * Установить ответы из Map (для совместимости)
	 */
	@Transient
	public void setAnswers(Map<String, Object> answers) {
		// В реальности это JSON сериализация
		this.answers = "{}";
	}

	/**
	 * Получить количество правильных ответов
	 */
	@Transient
	public Integer getCorrectCount() {
		return correctCount != null ? correctCount : 0;
	}

	/**
	 * Получить общее количество вопросов
	 */
	@Transient
	public Integer getTotalQuestions() {
		return totalQuestions != null ? totalQuestions : 0;
	}

	/**
	 * Получить балл
	 */
	@Transient
	public Double getScore() {
		return score;
	}

	/**
	 * Установить балл
	 */
	@Transient
	public void setScore(Double score) {
		this.score = score;
	}

	/**
	 * Получить время завершения
	 */
	@Transient
	public LocalDateTime getFinishedAt() {
		return finishedAt;
	}

	/**
	 * Установить время завершения
	 */
	@Transient
	public void setFinishedAt(LocalDateTime finishedAt) {
		this.finishedAt = finishedAt;
	}

	/**
	 * Номер попытки (1, 2, 3...)
	 */
	@Column(name = "attempt_number", nullable = false)
	@Builder.Default
	private Integer attemptNumber = 1;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	@Builder.Default
	private AttemptStatus status = AttemptStatus.IN_PROGRESS;

	/**
	 * Была ли попытка прервана (timeout, закрытие браузера)
	 */
	@Column(name = "is_interrupted", nullable = false)
	@Builder.Default
	private Boolean isInterrupted = false;

	/**
	 * Причина прерывания
	 */
	@Column(name = "interruption_reason", length = 255)
	private String interruptionReason;

	/**
	 * URL загруженного изображения решения
	 */
	@Column(name = "solution_image_url", length = 500)
	private String solutionImageUrl;

	/**
	 * Дополнительные изображения решения (JSON массив)
	 */
	@Column(name = "additional_images", columnDefinition = "TEXT")
	private String additionalImages;

	/**
	 * Текст решения (для развёрнутых ответов)
	 */
	@Column(name = "solution_text", columnDefinition = "TEXT")
	private String solutionText;

	/**
	 * URL PDF файла решения
	 */
	@Column(name = "solution_pdf_url", length = 500)
	private String solutionPdfUrl;

	/**
	 * Распознанный текст (OCR)
	 */
	@Column(name = "recognized_text", columnDefinition = "TEXT")
	private String recognizedText;

	/**
	 * Уверенность OCR (0.0 - 1.0)
	 */
	@Column(name = "ocr_confidence")
	private Double ocrConfidence;

	/**
	 * AI анализ решения
	 */
	@Column(name = "ai_analysis", columnDefinition = "TEXT")
	private String aiAnalysis;

	/**
	 * Обратная связь от AI
	 */
	@Column(name = "ai_feedback", columnDefinition = "TEXT")
	private String aiFeedback;

	/**
	 * Тип ошибки по AI-анализу CALCULATION, CONCEPT, LOGIC, NOTATION, NONE
	 */
	@Column(name = "ai_error_type", length = 30)
	private String aiErrorType;

	/**
	 * Рекомендации от AI
	 */
	@Column(name = "ai_recommendations", columnDefinition = "TEXT")
	private String aiRecommendations;

	/**
	 * Оценка качества решения от AI (1-5)
	 */
	@Column(name = "ai_quality_score")
	private Integer aiQualityScore;

	/**
	 * ID задачи в Celery для асинхронной проверки
	 */
	@Column(name = "celery_task_id", length = 100)
	private String celeryTaskId;

	/**
	 * Статус AI-проверки PENDING, PROCESSING, COMPLETED, FAILED
	 */
	@Column(name = "ai_check_status", length = 20)
	private String aiCheckStatus;

	/**
	 * Ручная проверка учителем
	 */
	@Column(name = "is_manually_checked", nullable = false)
	@Builder.Default
	private Boolean isManuallyChecked = false;

	/**
	 * Проверено учителем (ID)
	 */
	@Column(name = "checked_by_id")
	private UUID checkedById;

	/**
	 * Комментарий учителя
	 */
	@Column(name = "teacher_comment", columnDefinition = "TEXT")
	private String teacherComment;

	/**
	 * Учитель изменил оценку
	 */
	@Column(name = "score_overridden", nullable = false)
	@Builder.Default
	private Boolean scoreOverridden = false;

	/**
	 * Изначальный балл (до ручной коррекции)
	 */
	@Column(name = "original_points")
	private Integer originalPoints;

	/**
	 * IP-адрес ученика
	 */
	@Column(name = "client_ip", length = 45)
	private String clientIp;

	/**
	 * User-Agent браузера
	 */
	@Column(name = "user_agent", length = 500)
	private String userAgent;

	/**
	 * Тип устройства (desktop, mobile, tablet)
	 */
	@Column(name = "device_type", length = 20)
	private String deviceType;

	/**
	 * ID сессии
	 */
	@Column(name = "session_id", length = 100)
	private String sessionId;

	/**
	 * Количество переключений вкладки
	 */
	@Column(name = "tab_switches_count")
	@Builder.Default
	private Integer tabSwitchesCount = 0;

	/**
	 * Был ли копипаст
	 */
	@Column(name = "copy_paste_detected", nullable = false)
	@Builder.Default
	private Boolean copyPasteDetected = false;

	/**
	 * Флаг подозрительной активности
	 */
	@Column(name = "is_suspicious", nullable = false)
	@Builder.Default
	private Boolean isSuspicious = false;

	/**
	 * Причина подозрения
	 */
	@Column(name = "suspicious_reason", length = 500)
	private String suspiciousReason;

	/**
	 * Дочерние попытки (для retry)
	 */
	@OneToMany(mappedBy = "parentAttempt", cascade = CascadeType.ALL)
	@Builder.Default
	private List<Attempt> retryAttempts = new ArrayList<>();

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_attempt_id")
	private Attempt parentAttempt;

	@Transient
	public boolean isPassed() {
		return isCorrect != null && isCorrect;
	}

	@Transient
	public boolean isCompleted() {
		return status == AttemptStatus.COMPLETED || status == AttemptStatus.CHECKED;
	}

	@Transient
	public boolean needsManualCheck() {
		return status == AttemptStatus.NEEDS_REVIEW || (solutionImageUrl != null && !isManuallyChecked);
	}

	@Transient
	public double getScorePercent() {
		if (maxPoints == 0) {
			return 0.0;
		}
		return (double) pointsEarned / maxPoints * 100;
	}

	@Transient
	public long getTimeSpentMinutes() {
		if (timeSpentSeconds == null) {
			return 0;
		}
		return timeSpentSeconds / 60;
	}

	/**
	 * Фиксирует ответ ученика
	 */
	public void submitAnswer(String answer) {
		this.userAnswer = answer;
		this.answeredAt = LocalDateTime.now();
		this.timeSpentSeconds = (int) ChronoUnit.SECONDS.between(startedAt, answeredAt);
		this.status = AttemptStatus.SUBMITTED;
	}

	/**
	 * Проверяет ответ автоматически
	 */
	public void checkAnswer() {
		if (question == null || userAnswer == null) {
			return;
		}

		this.isCorrect = question.checkAnswer(userAnswer);
		this.checkedAt = LocalDateTime.now();

		if (isCorrect) {
			this.pointsEarned = maxPoints;
		} else {
			this.pointsEarned = 0;
		}

		this.status = AttemptStatus.CHECKED;

		question.recordAttempt(isCorrect, timeSpentSeconds != null ? timeSpentSeconds : 0);
	}

	/**
	 * Ручная проверка учителем
	 */
	public void manualCheck(UUID teacherId, int points, String comment) {
		this.isManuallyChecked = true;
		this.checkedById = teacherId;
		this.teacherComment = comment;
		this.checkedAt = LocalDateTime.now();

		if (this.pointsEarned != points) {
			this.scoreOverridden = true;
			this.originalPoints = this.pointsEarned;
			this.pointsEarned = points;
		}

		this.isCorrect = points >= maxPoints * 0.5;
		this.status = AttemptStatus.CHECKED;
	}

	/**
	 * Помечает для ручной проверки
	 */
	public void markForReview(String reason) {
		this.status = AttemptStatus.NEEDS_REVIEW;
		this.teacherComment = reason;
	}

	/**
	 * Помечает как подозрительную
	 */
	public void markSuspicious(String reason) {
		this.isSuspicious = true;
		this.suspiciousReason = reason;
	}

	/**
	 * Обработка прерывания
	 */
	public void handleInterruption(String reason) {
		this.isInterrupted = true;
		this.interruptionReason = reason;
		this.status = AttemptStatus.INTERRUPTED;
		this.timeSpentSeconds = (int) ChronoUnit.SECONDS.between(startedAt, LocalDateTime.now());
	}

	/**
	 * Устанавливает результат AI-проверки
	 */
	public void setAiResult(String analysis, String feedback, String errorType, String recommendations,
			int qualityScore) {
		this.aiAnalysis = analysis;
		this.aiFeedback = feedback;
		this.aiErrorType = errorType;
		this.aiRecommendations = recommendations;
		this.aiQualityScore = qualityScore;
		this.aiCheckStatus = "COMPLETED";
	}

	/**
	 * Создаёт новую попытку (retry)
	 */
	public Attempt createRetry() {
		return Attempt.builder().student(this.student).assignment(this.assignment).question(this.question)
				.attemptNumber(this.attemptNumber + 1).maxPoints(this.maxPoints).parentAttempt(this)
				.startedAt(LocalDateTime.now()).status(AttemptStatus.IN_PROGRESS).build();
	}

	/**
	 * Рассчитывает штраф за позднюю сдачу
	 */
	public int calculateLatePenalty() {
		if (assignment == null || assignment.getSoftDeadline() == null) {
			return 0;
		}

		if (answeredAt != null && answeredAt.isAfter(assignment.getSoftDeadline())) {
			int penaltyPercent = assignment.getLatePenaltyPercent();
			return (int) Math.ceil(pointsEarned * penaltyPercent / 100.0);
		}

		return 0;
	}

	/**
	 * Применяет штраф за позднюю сдачу
	 */
	public void applyLatePenalty() {
		int penalty = calculateLatePenalty();
		if (penalty > 0) {
			this.originalPoints = this.pointsEarned;
			this.pointsEarned = Math.max(0, this.pointsEarned - penalty);
			this.scoreOverridden = true;
		}
	}
}
