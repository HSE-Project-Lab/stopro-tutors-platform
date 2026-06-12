package ru.stopro.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

/**
 * Информация о прочтении сообщения пользователем.
 * Используется для отслеживания статусов "Отправлено" и "Прочитано".
 */
@Entity
@Table(name = "message_read_receipts", indexes = {
	@Index(name = "idx_read_receipts_message", columnList = "message_id"),
	@Index(name = "idx_read_receipts_user", columnList = "user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageReadReceipt extends BaseEntity {

	/** Сообщение, которое было прочитано */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "message_id", nullable = false)
	private ChatMessage message;

	/** Пользователь, который прочитал сообщение */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/** Время прочтения */
	@Column(name = "read_at", nullable = false)
	@Builder.Default
	private LocalDateTime readAt = LocalDateTime.now();
}

