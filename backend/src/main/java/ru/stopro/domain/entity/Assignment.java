package ru.stopro.domain.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;

import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AssignmentStatus;
import ru.stopro.domain.enums.AssignmentType;

/**
 * Сущность Assignment - назначенные тесты/домашние задания
 * 
 * Связывает вопросы (Questions) с учениками через группы. Поддерживает: -
 * Различные типы (ДЗ, тест, контрольная, тренировка) - Ограничения по времени -
 * Различные режимы показа результатов - Автоматическое обновление статуса
 */
@Entity
@Table(name = "assignments", indexes = {@Index(name = "idx_assignment_teacher", columnList = "teacher_id"),
		@Index(name = "idx_assignment_group", columnList = "group_id"),
		@Index(name = "idx_assignment_status", columnList = "status"),
		@Index(name = "idx_assignment_deadline", columnList = "deadline"),
		@Index(name = "idx_assignment_type", columnList = "assignment_type"),
		@Index(name = "idx_assignment_dates", columnList = "start_date, deadline")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment extends BaseEntity {
	@Column(name = "title", nullable = false, length = 255)
	private String title;

	@Column(name = "description", columnDefinition = "TEXT")
	private String description;

	/**
	 * Инструкции для учеников
	 */
	@Column(name = "instructions", columnDefinition = "TEXT")
	private String instructions;

	@Enumerated(EnumType.STRING)
	@Column(name = "assignment_type", nullable = false, length = 30)
	@Builder.Default
	private AssignmentType assignmentType = AssignmentType.HOMEWORK;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	@Builder.Default
	private AssignmentStatus status = AssignmentStatus.DRAFT;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	/**
	 * ID создателя (для совместимости с сервисами)
	 */
	@Column(name = "created_by_id")
	private UUID createdById;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "group_id")
	private StudyGroup group;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id")
	private User student;

	/**
	 * Вопросы в задании Используем связующую таблицу для хранения порядка
	 */
	@ManyToMany(fetch = FetchType.EAGER)
	@JoinTable(name = "assignment_questions", joinColumns = @JoinColumn(name = "assignment_id"), inverseJoinColumns = @JoinColumn(name = "question_id"))
	@OrderColumn(name = "question_order")
	@Builder.Default
	private List<Question> questions = new ArrayList<>();

	/**
	 * Задачи ЕГЭ, добавленные учителем через конструктор ДЗ
	 */
	@ManyToMany(fetch = FetchType.EAGER)
	@JoinTable(name = "assignment_ege_tasks", joinColumns = @JoinColumn(name = "assignment_id"), inverseJoinColumns = @JoinColumn(name = "ege_task_id"))
	@OrderColumn(name = "task_order")
	@Builder.Default
	private List<EgeTask> egeTasks = new ArrayList<>();

	/**
	 * Попытки прохождения
	 */
	@OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL, orphanRemoval = true)
	@Builder.Default
	private List<Attempt> attempts = new ArrayList<>();

	/**
	 * Дата начала доступности (null = сразу доступно)
	 */
	@Column(name = "start_date")
	private LocalDateTime startDate;

	/**
	 * Дедлайн выполнения
	 */
	@Column(name = "deadline")
	private LocalDateTime deadline;

	/**
	 * "Мягкий" дедлайн - после него штраф к баллам
	 */
	@Column(name = "soft_deadline")
	private LocalDateTime softDeadline;

	/**
	 * Штраф за сдачу после soft_deadline (в процентах)
	 */
	@Column(name = "late_penalty_percent")
	@Builder.Default
	private Integer latePenaltyPercent = 0;

	/**
	 * Ограничение времени на выполнение (в минутах) null = без ограничения
	 */
	@Column(name = "time_limit_minutes")
	private Integer timeLimitMinutes;

	/**
	 * Максимальное количество попыток null = неограниченно
	 */
	@Column(name = "max_attempts")
	@Builder.Default
	private Integer maxAttempts = 1;

	/**
	 * Учитывать лучшую попытку (true) или последнюю (false)
	 */
	@Column(name = "use_best_attempt", nullable = false)
	@Builder.Default
	private Boolean useBestAttempt = true;

	/**
	 * Минимальное время между попытками (в минутах)
	 */
	@Column(name = "cooldown_minutes")
	@Builder.Default
	private Integer cooldownMinutes = 0;

	/**
	 * Показывать ли правильные ответы после завершения
	 */
	@Column(name = "show_correct_answers", nullable = false)
	@Builder.Default
	private Boolean showCorrectAnswers = true;

	/**
	 * Когда показывать ответы: IMMEDIATELY, AFTER_DEADLINE, NEVER
	 */
	@Column(name = "show_answers_mode", length = 30)
	@Builder.Default
	private String showAnswersMode = "AFTER_DEADLINE";

	/**
	 * Показывать решения
	 */
	@Column(name = "show_solutions", nullable = false)
	@Builder.Default
	private Boolean showSolutions = true;

	/**
	 * Показывать ответы после завершения (для совместимости)
	 */
	@Transient
	public Boolean isShowAnswersAfterCompletion() {
		return showCorrectAnswers;
	}

	/**
	 * Показывать решения после завершения (для совместимости)
	 */
	@Transient
	public Boolean isShowSolutionsAfterCompletion() {
		return showSolutions;
	}

	/**
	 * Получить ID создателя
	 */
	@Transient
	public UUID getCreatedById() {
		return createdById != null ? createdById : (teacher != null ? teacher.getId() : null);
	}

	/**
	 * Показывать результаты сразу после каждого вопроса
	 */
	@Column(name = "show_immediate_feedback", nullable = false)
	@Builder.Default
	private Boolean showImmediateFeedback = false;

	/**
	 * Перемешивать порядок вопросов
	 */
	@Column(name = "shuffle_questions", nullable = false)
	@Builder.Default
	private Boolean shuffleQuestions = false;

	/**
	 * Перемешивать варианты ответов (для multiple choice)
	 */
	@Column(name = "shuffle_answers", nullable = false)
	@Builder.Default
	private Boolean shuffleAnswers = false;

	/**
	 * Проходной балл (в процентах)
	 */
	@Column(name = "passing_score_percent")
	@Builder.Default
	private Integer passingScorePercent = 60;

	/**
	 * Общее количество баллов за задание
	 */
	@Column(name = "total_points", nullable = false)
	@Builder.Default
	private Integer totalPoints = 0;

	/**
	 * Весовой коэффициент в итоговой оценке
	 */
	@Column(name = "weight")
	@Builder.Default
	private Double weight = 1.0;

	/**
	 * Отправлять напоминание о дедлайне
	 */
	@Column(name = "send_deadline_reminder", nullable = false)
	@Builder.Default
	private Boolean sendDeadlineReminder = true;

	/**
	 * За сколько часов до дедлайна отправлять напоминание
	 */
	@Column(name = "reminder_hours_before")
	@Builder.Default
	private Integer reminderHoursBefore = 24;

	/**
	 * Уведомлять учителя о завершении учеником
	 */
	@Column(name = "notify_teacher_on_complete", nullable = false)
	@Builder.Default
	private Boolean notifyTeacherOnComplete = false;

	@Column(name = "views_count", nullable = false)
	@Builder.Default
	private Integer viewsCount = 0;

	@Column(name = "started_count", nullable = false)
	@Builder.Default
	private Integer startedCount = 0;

	@Column(name = "completed_count", nullable = false)
	@Builder.Default
	private Integer completedCount = 0;

	@Column(name = "average_score")
	private Double averageScore;

	@Column(name = "average_time_minutes")
	private Integer averageTimeMinutes;

	@Column(name = "published_at")
	private LocalDateTime publishedAt;

	@Column(name = "archived_at")
	private LocalDateTime archivedAt;

	/**
	 * Шаблон, из которого создано задание
	 */
	@Column(name = "template_id")
	private UUID templateId;

	/**
	 * Сохранить как шаблон
	 */
	@Column(name = "is_template", nullable = false)
	@Builder.Default
	private Boolean isTemplate = false;

	@Transient
	public int getQuestionsCount() {
		int count = (questions != null ? questions.size() : 0) + (egeTasks != null ? egeTasks.size() : 0);
		return count;
	}

	@Transient
	public boolean isAvailable() {
		LocalDateTime now = LocalDateTime.now();
		if (status != AssignmentStatus.PUBLISHED) {
			return false;
		}
		if (startDate != null && now.isBefore(startDate)) {
			return false;
		}
		return deadline == null || !now.isAfter(deadline);
	}

	@Transient
	public boolean isOverdue() {
		if (deadline == null)
			return false;
		return LocalDateTime.now().isAfter(deadline);
	}

	@Transient
	public boolean isInSoftDeadlinePeriod() {
		if (softDeadline == null || deadline == null) {
			return false;
		}
		LocalDateTime now = LocalDateTime.now();
		return now.isAfter(softDeadline) && !now.isAfter(deadline);
	}

	@Transient
	public long getDaysUntilDeadline() {
		if (deadline == null)
			return 0;
		return java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), deadline);
	}

	@Transient
	public long getHoursUntilDeadline() {
		if (deadline == null)
			return 0;
		return java.time.temporal.ChronoUnit.HOURS.between(LocalDateTime.now(), deadline);
	}

	@Transient
	public double getCompletionRate() {
		int totalStudents = 1;

		if (group != null) {
			totalStudents = group.getStudentsCount();
		}

		if (totalStudents == 0) {
			return 0.0;
		}
		return (double) completedCount / totalStudents * 100;
	}

	/**
	 * Публикует задание
	 */
	public void publish() {
		this.status = AssignmentStatus.PUBLISHED;
		this.publishedAt = LocalDateTime.now();

		this.totalPoints = questions.stream().mapToInt(Question::getPoints).sum();
	}

	/**
	 * Архивирует задание
	 */
	public void archive() {
		this.status = AssignmentStatus.ARCHIVED;
		this.archivedAt = LocalDateTime.now();
	}

	/**
	 * Добавляет вопрос в задание
	 */
	public void addQuestion(Question question) {
		questions.add(question);
		this.totalPoints = questions.stream().mapToInt(Question::getPoints).sum();
	}

	/**
	 * Удаляет вопрос из задания
	 */
	public void removeQuestion(Question question) {
		questions.remove(question);
		this.totalPoints = questions.stream().mapToInt(Question::getPoints).sum();
	}

	/**
	 * Проверяет, может ли ученик начать новую попытку
	 */
	public boolean canStartNewAttempt(User student) {
		if (!isAvailable()) {
			return false;
		}

		if (maxAttempts != null) {
			long studentAttempts = attempts.stream().filter(a -> a.getStudent().getId().equals(student.getId()))
					.count();
			if (studentAttempts >= maxAttempts) {
				return false;
			}
		}

		if (cooldownMinutes != null && cooldownMinutes > 0) {
			LocalDateTime lastAttemptTime = attempts.stream()
					.filter(a -> a.getStudent().getId().equals(student.getId())).map(Attempt::getStartedAt)
					.max(LocalDateTime::compareTo).orElse(null);

			if (lastAttemptTime != null) {
				LocalDateTime cooldownEnd = lastAttemptTime.plusMinutes(cooldownMinutes);
				if (LocalDateTime.now().isBefore(cooldownEnd)) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Обновляет статистику после завершения попытки
	 */
	public void updateStatistics(double score, int timeMinutes) {
		completedCount++;

		if (averageScore == null) {
			averageScore = score;
		} else {
			averageScore = (averageScore * (completedCount - 1) + score) / completedCount;
		}

		if (averageTimeMinutes == null) {
			averageTimeMinutes = timeMinutes;
		} else {
			averageTimeMinutes = (averageTimeMinutes * (completedCount - 1) + timeMinutes) / completedCount;
		}
	}

	/**
	 * Автоматически обновляет статус задания
	 */
	@PreUpdate
	protected void updateStatusAutomatically() {
		if (status == AssignmentStatus.PUBLISHED && isOverdue()) {
			int totalStudents = group.getStudentsCount();
			if (completedCount >= totalStudents) {
				status = AssignmentStatus.COMPLETED;
			} else {
				status = AssignmentStatus.OVERDUE;
			}
		}
	}

	/**
	 * Создаёт копию задания (для шаблонов)
	 */
	public Assignment createCopy(User newTeacher, StudyGroup newGroup, LocalDateTime newDeadline) {
		return Assignment.builder().title(this.title).description(this.description).instructions(this.instructions)
				.assignmentType(this.assignmentType).status(AssignmentStatus.DRAFT).teacher(newTeacher).group(newGroup)
				.deadline(newDeadline).questions(new ArrayList<>(this.questions)).maxAttempts(this.maxAttempts)
				.timeLimitMinutes(this.timeLimitMinutes).showCorrectAnswers(this.showCorrectAnswers)
				.showSolutions(this.showSolutions).shuffleQuestions(this.shuffleQuestions)
				.passingScorePercent(this.passingScorePercent)
				.templateId(this.isTemplate ? this.getId() : this.templateId).build();
	}
}
