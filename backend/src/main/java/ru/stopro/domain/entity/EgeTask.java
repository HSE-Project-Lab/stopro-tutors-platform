package ru.stopro.domain.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import ru.stopro.domain.enums.TaskDifficulty;

@Entity
@Table(name = "ege_tasks", indexes = {@Index(name = "idx_ege_tasks_number", columnList = "egeNumber"),
		@Index(name = "idx_ege_tasks_topic", columnList = "topic"),
		@Index(name = "idx_ege_tasks_difficulty", columnList = "difficulty"),
		@Index(name = "idx_ege_tasks_parent_id", columnList = "parent_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EgeTask {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private String id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_id")
	private EgeTask parent;

	@OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
	@Builder.Default
	private List<EgeTask> variants = new ArrayList<>();

	@Column(nullable = false)
	private Integer egeNumber;

	@Column(nullable = false)
	private String topic;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TaskDifficulty difficulty;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(columnDefinition = "TEXT")
	private String solution;

	@Column(nullable = false)
	private String answer;

	@ElementCollection
	@CollectionTable(name = "ege_task_images", joinColumns = @JoinColumn(name = "task_id"))
	@Column(name = "image_url")
	@Builder.Default
	private List<String> imageUrls = new ArrayList<>();

	@CreationTimestamp
	private LocalDateTime createdAt;

	@UpdateTimestamp
	private LocalDateTime updatedAt;
}