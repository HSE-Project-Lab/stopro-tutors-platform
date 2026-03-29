package ru.stopro.domain.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_assignment_submissions", indexes = {
		@Index(name = "idx_submission_student", columnList = "student_id"),
		@Index(name = "idx_submission_assignment", columnList = "assignment_id"),
		@Index(name = "idx_submission_submitted", columnList = "submitted_at")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAssignmentSubmission extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "assignment_id", nullable = false)
	private Assignment assignment;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@Column(name = "submitted_at", nullable = false)
	@Builder.Default
	private LocalDateTime submittedAt = LocalDateTime.now();

	@Column(name = "total_questions", nullable = false)
	@Builder.Default
	private Integer totalQuestions = 0;

	@Column(name = "answered_questions", nullable = false)
	@Builder.Default
	private Integer answeredQuestions = 0;

	@Column(name = "correct_answers", nullable = false)
	@Builder.Default
	private Integer correctAnswers = 0;

	@Column(name = "score_percent", nullable = false)
	@Builder.Default
	private Integer scorePercent = 0;

	@OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
	@Builder.Default
	private List<StudentAssignmentAnswerResult> answers = new ArrayList<>();
}
