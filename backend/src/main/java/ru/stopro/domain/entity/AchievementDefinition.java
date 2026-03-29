package ru.stopro.domain.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "achievement_definitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AchievementDefinition {

	@Id
	@Column(name = "achievement_key", nullable = false, updatable = false, length = 100)
	private String key;

	@Column(name = "title", nullable = false, length = 255)
	private String title;

	@Column(name = "description", nullable = false, columnDefinition = "TEXT")
	private String description;

	@Column(name = "category", nullable = false, length = 50)
	private String category;

	@Column(name = "rule_type", nullable = false, length = 50)
	private String ruleType;

	@Column(name = "rule_config", columnDefinition = "TEXT")
	private String ruleConfig;

	@Column(name = "target_value")
	private Integer targetValue;

	@Column(name = "icon_url", length = 255)
	private String iconUrl;

	@Column(name = "sort_order", nullable = false)
	@Builder.Default
	private Integer sortOrder = 0;

	@Column(name = "is_active", nullable = false)
	@Builder.Default
	private Boolean isActive = true;

	@Column(name = "created_at", nullable = false)
	@Builder.Default
	private LocalDateTime createdAt = LocalDateTime.now();

	@Column(name = "updated_at")
	private LocalDateTime updatedAt;
}
