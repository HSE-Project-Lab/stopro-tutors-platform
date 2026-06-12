package ru.stopro.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

import ru.stopro.domain.enums.AttachmentType;

/**
 * Вложение в сообщение (изображение или видео).
 */
@Entity
@Table(name = "message_attachments", indexes = {
	@Index(name = "idx_attachments_message", columnList = "message_id"),
	@Index(name = "idx_attachments_type", columnList = "file_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageAttachment extends BaseEntity {

	/** Сообщение, к которому относится вложение */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "message_id", nullable = false)
	private ChatMessage message;

	/** URL файла */
	@Column(name = "file_url", nullable = false, length = 500)
	private String fileUrl;

	/** Тип вложения: IMAGE или VIDEO */
	@Enumerated(EnumType.STRING)
	@Column(name = "file_type", nullable = false, length = 30)
	private AttachmentType fileType;

	/** Исходное имя файла */
	@Column(name = "file_name", nullable = false, length = 255)
	private String fileName;

	/** Размер файла в МБ */
	@Column(name = "file_size_mb")
	private Double fileSizeMb;

	/** Ширина изображения/видео в пикселях */
	@Column(name = "width")
	private Integer width;

	/** Высота изображения/видео в пикселях */
	@Column(name = "height")
	private Integer height;

	/** Длительность видео в секундах */
	@Column(name = "duration_sec")
	private Integer durationSec;

	/** Время создания вложения */
	@Column(name = "created_at", nullable = false)
	@Builder.Default
	private LocalDateTime createdAt = LocalDateTime.now();

	/** Время обновления */
	@Column(name = "updated_at")
	private LocalDateTime updatedAt;

	/** Версия для оптимистичного заблокирования */
	@Column(name = "version", nullable = false)
	@Builder.Default
	private Long version = 0L;

	/** Флаг удаления */
	@Column(name = "is_deleted", nullable = false)
	@Builder.Default
	private Boolean isDeleted = false;
}

