package ru.stopro.dto.attempt;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.enums.AttemptStatus;

/**
 * DTO с результатом попытки
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptResultDto {

	private UUID id;
	private UUID questionId;
	private String questionContent;
	private String userAnswer;
	private String correctAnswer;
	private Boolean isCorrect;
	private Integer pointsEarned;
	private Integer maxPoints;
	private Integer timeSpentSeconds;
	private String aiFeedback;
	private String aiErrorType;
	private String solution;

	private String assignmentTitle;
	private AttemptStatus status;
	private LocalDateTime startedAt;
	private LocalDateTime finishedAt;
	private int correctCount;
	private int totalQuestions;
	private Double score;
	private Map<String, Object> answers;
	private boolean showAnswers;
	private boolean showSolutions;
}
