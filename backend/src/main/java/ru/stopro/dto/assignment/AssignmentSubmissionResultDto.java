package ru.stopro.dto.assignment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSubmissionResultDto {

	private UUID assignmentId;
	private String assignmentTitle;
	private String status;
	private LocalDateTime submittedAt;

	private Integer totalQuestions;
	private Integer answeredQuestions;
	private Integer correctAnswers;
	private Integer scorePercent;

	private List<QuestionResult> questionResults;

	@Data
	@Builder
	@NoArgsConstructor
	@AllArgsConstructor
	public static class QuestionResult {
		private String questionId;
		private Integer index;
		private Integer egeNumber;
		private String topicName;
		private String content;

		private String userAnswer;
		private Boolean isCorrect;

		private String correctAnswer;
		private String solution;
	}
}
