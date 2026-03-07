package ru.stopro.domain.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

/**
 * Тема/раздел математики (соответствует заданиям ЕГЭ)
 */
@Entity
@Table(name = "topics", indexes = {@Index(name = "idx_topic_ege_number", columnList = "ege_number"),
		@Index(name = "idx_topic_parent", columnList = "parent_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Topic extends BaseEntity {

	@Column(name = "name", nullable = false, length = 255)
	private String name;

	@Column(name = "description", columnDefinition = "TEXT")
	private String description;

	@Column(name = "ege_number")
	private Integer egeNumber;

	@Column(name = "order_index", nullable = false)
	@Builder.Default
	private Integer orderIndex = 0;

	@Column(name = "is_active", nullable = false)
	@Builder.Default
	private Boolean isActive = true;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_id")
	private Topic parent;

	@OneToMany(mappedBy = "parent", cascade = CascadeType.ALL)
	@Builder.Default
	private List<Topic> children = new ArrayList<>();

	@OneToMany(mappedBy = "topic", cascade = CascadeType.ALL)
	@Builder.Default
	private List<Question> questions = new ArrayList<>();

	@Transient
	public int getQuestionsCount() {
		return questions.size();
	}

	@Transient
	public boolean hasChildren() {
		return !children.isEmpty();
	}

	@Transient
	public boolean isRootTopic() {
		return parent == null;
	}
}
