
package ru.stopro.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import ru.stopro.domain.enums.TaskDifficulty;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ege_tasks", indexes = {
    @Index(name = "idx_ege_tasks_number", columnList = "egeNumber"),
    @Index(name = "idx_ege_tasks_topic", columnList = "topic"),
    @Index(name = "idx_ege_tasks_difficulty", columnList = "difficulty"),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EgeTask {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private Integer egeNumber; // 1-12

    @Column(nullable = false)
    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskDifficulty difficulty;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // условие в LaTeX

    @Column(columnDefinition = "TEXT")
    private String solution; // решение в LaTeX

    @Column(nullable = false)
    private String answer; // правильный ответ

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