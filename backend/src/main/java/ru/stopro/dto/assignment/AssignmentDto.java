package ru.stopro.dto.assignment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.enums.AssignmentStatus;
import ru.stopro.domain.enums.AssignmentType;
import ru.stopro.dto.egetask.EgeTaskDto;
import ru.stopro.dto.question.QuestionDto;

/**
 * DTO для назначенного задания
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentDto {

	private UUID studentId;
	private String studentName;

	private UUID id;
	private UUID teacherId;
	private String teacherName;
	private UUID groupId;
	private String groupName;

	private String title;
	private String description;
	private String instructions;
	private AssignmentType assignmentType;
	private AssignmentStatus status;

	private LocalDateTime startDate;
	private LocalDateTime deadline;
	private LocalDateTime softDeadline;
	private Integer timeLimitMinutes;

	private Integer maxAttempts;
	private Boolean useBestAttempt;

	private Boolean showCorrectAnswers;
	private Boolean showSolutions;
	private Boolean showImmediateFeedback;
	private Boolean shuffleQuestions;

	private Integer passingScorePercent;
	private Integer totalPoints;
	private Integer questionsCount;

	private Integer viewsCount;
	private Integer startedCount;
	private Integer completedCount;
	private Double averageScore;
	private Integer averageTimeMinutes;
	private Double completionRate;

	private Boolean isAvailable;
	private Boolean isOverdue;
	private Long daysUntilDeadline;
	private Long hoursUntilDeadline;

	private List<QuestionDto> questions;
	private List<EgeTaskDto> egeTasks;

	private LocalDateTime createdAt;
	private LocalDateTime publishedAt;

	private Boolean isTemplate;

	/**
	 * Конвертация из Entity
	 */
	public static AssignmentDto fromEntity(Assignment assignment) {
		return fromEntity(assignment, false);
	}

	/**
	 * Конвертация из Entity с включением вопросов
	 */
	public static AssignmentDto fromEntity(Assignment assignment, boolean includeQuestions) {
		AssignmentDtoBuilder builder = AssignmentDto.builder().id(assignment.getId()).title(assignment.getTitle())
				.description(assignment.getDescription()).instructions(assignment.getInstructions())
				.assignmentType(assignment.getAssignmentType()).status(assignment.getStatus())
				.startDate(assignment.getStartDate()).deadline(assignment.getDeadline())
				.softDeadline(assignment.getSoftDeadline()).timeLimitMinutes(assignment.getTimeLimitMinutes())
				.maxAttempts(assignment.getMaxAttempts()).useBestAttempt(assignment.getUseBestAttempt())
				.showCorrectAnswers(assignment.getShowCorrectAnswers()).showSolutions(assignment.getShowSolutions())
				.showImmediateFeedback(assignment.getShowImmediateFeedback())
				.shuffleQuestions(assignment.getShuffleQuestions())
				.passingScorePercent(assignment.getPassingScorePercent()).totalPoints(assignment.getTotalPoints())
				.questionsCount(assignment.getQuestionsCount()).viewsCount(assignment.getViewsCount())
				.startedCount(assignment.getStartedCount()).completedCount(assignment.getCompletedCount())
				.averageScore(assignment.getAverageScore()).averageTimeMinutes(assignment.getAverageTimeMinutes())
				.completionRate(assignment.getCompletionRate()).isAvailable(assignment.isAvailable())
				.isOverdue(assignment.isOverdue()).daysUntilDeadline(assignment.getDaysUntilDeadline())
				.hoursUntilDeadline(assignment.getHoursUntilDeadline()).createdAt(assignment.getCreatedAt())
				.publishedAt(assignment.getPublishedAt()).isTemplate(assignment.getIsTemplate());

		if (assignment.getTeacher() != null) {
			builder.teacherId(assignment.getTeacher().getId());
			builder.teacherName(assignment.getTeacher().getFullName());
		}

		if (assignment.getGroup() != null) {
			builder.groupId(assignment.getGroup().getId());
			builder.groupName(assignment.getGroup().getName());
		}

		if (assignment.getStudent() != null) {
			builder.studentId(assignment.getStudent().getId());
			builder.studentName(assignment.getStudent().getFullName());
		}

		if (includeQuestions && assignment.getQuestions() != null) {
			builder.questions(assignment.getQuestions().stream().map(QuestionDto::fromEntityForStudent).toList());
		}

		if (assignment.getEgeTasks() != null && !assignment.getEgeTasks().isEmpty()) {
			builder.egeTasks(assignment.getEgeTasks().stream()
					.map(t -> EgeTaskDto.builder().id(t.getId()).egeNumber(t.getEgeNumber()).topic(t.getTopic())
							.difficulty(t.getDifficulty()).content(t.getContent()).solution(t.getSolution())
							.answer(t.getAnswer()).imageUrls(t.getImageUrls()).createdAt(t.getCreatedAt())
							.updatedAt(t.getUpdatedAt()).build())
					.toList());
		}

		return builder.build();
	}
}
