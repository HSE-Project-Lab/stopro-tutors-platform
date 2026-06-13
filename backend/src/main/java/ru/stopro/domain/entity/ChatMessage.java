package ru.stopro.domain.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

import ru.stopro.domain.enums.ChatMessageType;

/**
 * Сообщение в чате.
 * Поддерживает текстовые сообщения с форматированием и системные сообщения.
 */
@Entity
@Table(name = "chat_messages", indexes = {
	@Index(name = "idx_messages_chat", columnList = "chat_id"),
	@Index(name = "idx_messages_sender", columnList = "sender_id"),
	@Index(name = "idx_messages_created_at", columnList = "created_at"),
	@Index(name = "idx_messages_chat_created", columnList = "chat_id, created_at"),
	@Index(name = "idx_messages_type", columnList = "message_type"),
	@Index(name = "idx_messages_pinned", columnList = "pinned_by_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage extends BaseEntity {

	/** Чат, к которому относится сообщение */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "chat_id", nullable = false)
	private Chat chat;

	/** Отправитель сообщения */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "sender_id", nullable = false)
	private User sender;

	/** Тип сообщения: TEXT или SYSTEM */
	@Enumerated(EnumType.STRING)
	@Column(name = "message_type", nullable = false, length = 30)
	@Builder.Default
	private ChatMessageType messageType = ChatMessageType.TEXT;

	/** Содержание сообщения (может быть JSON с форматированием или простой текст) */
	@Column(name = "content", nullable = false, columnDefinition = "TEXT")
	private String content;

	/** Сохраняется plain text версия для полнотекстового поиска */
	@Column(name = "content_plain", columnDefinition = "TEXT")
	private String contentPlain;

	/** Флаг, отредактировано ли сообщение */
	@Column(name = "is_edited", nullable = false)
	@Builder.Default
	private Boolean isEdited = false;

	/** Время редактирования */
	@Column(name = "edited_at")
	private LocalDateTime editedAt;

	/** ID учителя, который закрепил сообщение (NULL если не закреплено) */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "pinned_by_id")
	private User pinnedBy;

	/** Время закрепления сообщения */
	@Column(name = "pinned_at")
	private LocalDateTime pinnedAt;

	/** Сообщение, на которое отвечают (NULL если это не ответ) */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "reply_to_id")
	private ChatMessage replyTo;

	/** Вложения к сообщению */
	@OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	@Builder.Default
	private List<MessageAttachment> attachments = new ArrayList<>();

	/** Информация о прочтении */
	@OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	@Builder.Default
	private List<MessageReadReceipt> readReceipts = new ArrayList<>();

	/**
	 * Получить количество пользователей, которые прочитали сообщение.
	 */
	@Transient
	public int getReadCount() {
		return readReceipts != null ? readReceipts.size() : 0;
	}

	/**
	 * Проверить, прочитано ли сообщение указанным пользователем.
	 */
	@Transient
	public boolean isReadBy(User user) {
		if (readReceipts == null) return false;
		return readReceipts.stream()
			.anyMatch(r -> r.getUser().getId().equals(user.getId()));
	}

	/**
	 * Проверить, закреплено ли сообщение.
	 */
	@Transient
	public boolean isPinned() {
		return pinnedBy != null;
	}
}

