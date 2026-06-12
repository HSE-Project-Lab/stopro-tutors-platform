package ru.stopro.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

/**
 * Участник чата. Отслеживает, кто состоит в чате и время последнего прочтения.
 */
@Entity
@Table(name = "chat_participants", indexes = {
	@Index(name = "idx_chat_participants_chat", columnList = "chat_id"),
	@Index(name = "idx_chat_participants_user", columnList = "user_id"),
	@Index(name = "idx_chat_participants_last_read", columnList = "last_read_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatParticipant extends BaseEntity {

	/** Чат, в котором участвует пользователь */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "chat_id", nullable = false)
	private Chat chat;

	/** Пользователь-участник */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	/** Время присоединения к чату */
	@Column(name = "joined_at", nullable = false)
	@Builder.Default
	private LocalDateTime joinedAt = LocalDateTime.now();

	/** Время последнего прочтения сообщений в чате */
	@Column(name = "last_read_at")
	private LocalDateTime lastReadAt;

	/** Время выхода из чата (NULL если все еще участвует) */
	@Column(name = "left_at")
	private LocalDateTime leftAt;

	/**
	 * Получить количество непрочитанных сообщений.
	 * Реализуется через repository query.
	 */
	@Transient
	private Integer unreadCount;

	/**
	 * Проверить, активный ли участник в чате.
	 */
	@Transient
	public boolean isActive() {
		return leftAt == null;
	}
}

