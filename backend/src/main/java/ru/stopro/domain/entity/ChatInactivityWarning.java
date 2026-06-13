package ru.stopro.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

/**
 * Отслеживание предупреждений об неактивности чата.
 * Используется для автоматического удаления чатов через год неактивности.
 */
@Entity
@Table(name = "chat_inactivity_warnings", indexes = {
	@Index(name = "idx_inactivity_chat", columnList = "chat_id"),
	@Index(name = "idx_inactivity_scheduled_deletion", columnList = "scheduled_deletion_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatInactivityWarning extends BaseEntity {

	/** Чат, к которому относится предупреждение */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "chat_id", nullable = false)
	private Chat chat;

	/** Время отправки предупреждения */
	@Column(name = "warning_sent_at", nullable = false)
	private LocalDateTime warningSentAt;

	/** Запланированное время удаления */
	@Column(name = "scheduled_deletion_at", nullable = false)
	private LocalDateTime scheduledDeletionAt;

	/** Было ли предупреждение отменено преподавателем */
	@Column(name = "warning_dismissed", nullable = false)
	@Builder.Default
	private Boolean warningDismissed = false;
}

