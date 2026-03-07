package ru.stopro.domain.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

/**
 * Учебная группа. Учитель создаёт группу и добавляет в неё учеников.
 */
@Entity
@Table(name = "study_groups", indexes = {@Index(name = "idx_group_teacher", columnList = "teacher_id"),
		@Index(name = "idx_group_invite_code", columnList = "invite_code", unique = true)})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyGroup extends BaseEntity {

	/** Название группы */
	@Column(name = "name", nullable = false, length = 255)
	private String name;

	/** Учитель — владелец группы */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id", nullable = false)
	private User teacher;

	/** Уникальный код-приглашение для входа в группу */
	@Column(name = "invite_code", nullable = false, unique = true, length = 10)
	private String inviteCode;

	/** Ученики, входящие в группу (ManyToMany) */
	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(name = "group_students", joinColumns = @JoinColumn(name = "group_id"), inverseJoinColumns = @JoinColumn(name = "student_id"))
	@Builder.Default
	private List<User> students = new ArrayList<>();

	@Transient
	public int getStudentsCount() {
		return students != null ? students.size() : 0;
	}
}
