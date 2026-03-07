package ru.stopro.dto.attempt;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.entity.Attempt;
import ru.stopro.domain.enums.AttemptStatus;

/**
 * DTO для попытки решения
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptDto {

	private UUID id;
	private UUID studentId;
	private String studentName;
	private UUID assignmentId;
	private String assignmentTitle;
	private UUID questionId;
	private Integer questionEgeNumber;

	private String userAnswer;
	private Boolean isCorrect;
	private Double partialScore;
	private Integer pointsEarned;
	private Integer maxPoints;

	private LocalDateTime startedAt;
	private LocalDateTime answeredAt;
	private LocalDateTime checkedAt;
	private LocalDateTime finishedAt;
	private Integer timeSpentSeconds;
	private Integer attemptNumber;

	private AttemptStatus status;
	private Boolean isInterrupted;

	private String solutionImageUrl;
	private String solutionText;

	private String recognizedText;
	private Double ocrConfidence;
	private String aiFeedback;
	private String aiErrorType;
	private String aiRecommendations;
	private Integer aiQualityScore;
	private String aiCheckStatus;

	private Boolean isManuallyChecked;
	private String teacherComment;
	private Boolean scoreOverridden;

	/**
	 * Конвертация из Entity
	 */
	public static AttemptDto fromEntity(Attempt attempt) {
		AttemptDtoBuilder builder = AttemptDto.builder().id(attempt.getId()).userAnswer(attempt.getUserAnswer())
				.isCorrect(attempt.getIsCorrect()).partialScore(attempt.getPartialScore())
				.pointsEarned(attempt.getPointsEarned()).maxPoints(attempt.getMaxPoints())
				.startedAt(attempt.getStartedAt()).answeredAt(attempt.getAnsweredAt()).checkedAt(attempt.getCheckedAt())
				.timeSpentSeconds(attempt.getTimeSpentSeconds()).attemptNumber(attempt.getAttemptNumber())
				.status(attempt.getStatus()).isInterrupted(attempt.getIsInterrupted())
				.solutionImageUrl(attempt.getSolutionImageUrl()).solutionText(attempt.getSolutionText())
				.recognizedText(attempt.getRecognizedText()).ocrConfidence(attempt.getOcrConfidence())
				.aiFeedback(attempt.getAiFeedback()).aiErrorType(attempt.getAiErrorType())
				.aiRecommendations(attempt.getAiRecommendations()).aiQualityScore(attempt.getAiQualityScore())
				.aiCheckStatus(attempt.getAiCheckStatus()).isManuallyChecked(attempt.getIsManuallyChecked())
				.teacherComment(attempt.getTeacherComment()).scoreOverridden(attempt.getScoreOverridden());

		if (attempt.getStudent() != null) {
			builder.studentId(attempt.getStudent().getId());
			builder.studentName(attempt.getStudent().getFullName());
		}

		if (attempt.getAssignment() != null) {
			builder.assignmentId(attempt.getAssignment().getId());
			builder.assignmentTitle(attempt.getAssignment().getTitle());
		}

		if (attempt.getQuestion() != null) {
			builder.questionId(attempt.getQuestion().getId());
			builder.questionEgeNumber(attempt.getQuestion().getEgeNumber());
		}

		return builder.build();
	}
}
