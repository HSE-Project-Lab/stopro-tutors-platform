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
@Table(name = "student_achievements", uniqueConstraints = {
		@UniqueConstraint(name = "uq_student_achievement", columnNames = {"student_id",
				"achievement_key"})}, indexes = {
						@Index(name = "idx_student_achievement_student", columnList = "student_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAchievement extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "achievement_key", nullable = false, referencedColumnName = "achievement_key")
	private AchievementDefinition achievement;

	@Column(name = "unlocked_at", nullable = false)
	private LocalDateTime unlockedAt;
}
