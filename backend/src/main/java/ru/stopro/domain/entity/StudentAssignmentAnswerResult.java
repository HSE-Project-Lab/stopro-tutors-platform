package ru.stopro.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_assignment_answer_results", indexes = {
		@Index(name = "idx_answer_result_submission", columnList = "submission_id"),
		@Index(name = "idx_answer_result_correct", columnList = "is_correct")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAssignmentAnswerResult extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "submission_id", nullable = false)
	private StudentAssignmentSubmission submission;

	@Column(name = "question_ref_id", nullable = false, length = 100)
	private String questionRefId;

	@Column(name = "question_index", nullable = false)
	private Integer questionIndex;

	@Column(name = "ege_number")
	private Integer egeNumber;

	@Column(name = "topic_name", length = 255)
	private String topicName;

	@Column(name = "content", columnDefinition = "TEXT")
	private String content;

	@Column(name = "user_answer", columnDefinition = "TEXT")
	private String userAnswer;

	@Column(name = "is_correct", nullable = false)
	private Boolean isCorrect;

	@Column(name = "correct_answer", columnDefinition = "TEXT")
	private String correctAnswer;

	@Column(name = "solution", columnDefinition = "TEXT")
	private String solution;
}
