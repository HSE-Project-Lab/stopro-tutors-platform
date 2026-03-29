package ru.stopro.domain.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

import ru.stopro.domain.enums.AchievementEventType;

@Entity
@Table(name = "student_achievement_events", indexes = {
		@Index(name = "idx_achievement_event_student", columnList = "student_id"),
		@Index(name = "idx_achievement_event_type", columnList = "event_type"),
		@Index(name = "idx_achievement_event_date", columnList = "event_date")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentAchievementEvent extends BaseEntity {

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id", nullable = false)
	private User student;

	@Enumerated(EnumType.STRING)
	@Column(name = "event_type", nullable = false, length = 80)
	private AchievementEventType eventType;

	@Column(name = "event_date", nullable = false)
	private LocalDate eventDate;

	@Column(name = "event_at", nullable = false)
	private LocalDateTime eventAt;

	@Column(name = "reference_id", length = 120)
	private String referenceId;

	@Column(name = "payload", columnDefinition = "TEXT")
	private String payload;
}
