package ru.stopro.domain.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

import ru.stopro.domain.enums.ChatStatus;
import ru.stopro.domain.enums.ChatType;

@Entity
@Table(name = "chats", indexes = {
		@Index(name = "idx_chats_teacher", columnList = "teacher_id"),
		@Index(name = "idx_chats_type", columnList = "chat_type"),
		@Index(name = "idx_chats_status", columnList = "status"),
		@Index(name = "idx_chats_last_message", columnList = "last_message_at")
})
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "chat_type", discriminatorType = DiscriminatorType.STRING, length = 30)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Chat extends BaseEntity {

	@Enumerated(EnumType.STRING)
	@Column(name = "chat_type", nullable = false, insertable = false, updatable = false, length = 30)
	private ChatType chatType;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	@Column(name = "chat_name", length = 255)
	private String chatName;

	@Column(name = "chat_avatar_url", length = 500)
	private String chatAvatarUrl;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private ChatStatus status = ChatStatus.ACTIVE;

	@Column(name = "last_message_at")
	private LocalDateTime lastMessageAt;

	@OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<ChatParticipant> participants = new ArrayList<>();

	@OneToMany(mappedBy = "chat", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
	private List<ChatMessage> messages = new ArrayList<>();
}