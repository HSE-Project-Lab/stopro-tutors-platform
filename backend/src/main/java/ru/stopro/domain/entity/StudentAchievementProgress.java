package ru.stopro.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "student_achievement_progress", uniqueConstraints = {
		@UniqueConstraint(name = "uq_achievement_progress_student_key", columnNames = {"student_id",
				"achievement_key"})}, indexes = {
						@Index(name = "idx_achievement_progress_student", columnList = "student_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAchievementProgress extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "achievement_key", nullable = false, referencedColumnName = "achievement_key")
	private AchievementDefinition achievement;

	@Column(name = "current_value", nullable = false)
	@Builder.Default
	private Integer currentValue = 0;

	@Column(name = "target_value")
	private Integer targetValue;

	@Column(name = "is_completed", nullable = false)
	@Builder.Default
	private Boolean isCompleted = false;

	@Column(name = "last_event_at")
	private LocalDateTime lastEventAt;

	@Column(name = "unlocked_at")
	private LocalDateTime unlockedAt;
}
