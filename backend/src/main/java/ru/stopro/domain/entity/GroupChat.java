package ru.stopro.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import ru.stopro.domain.enums.ChatType;

@Entity
@DiscriminatorValue("GROUP")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GroupChat extends Chat {

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "study_group_id", nullable = false)
	private StudyGroup studyGroup;

	@Column(name = "next_group_number")
	private Integer nextGroupNumber = 1;

	@PostLoad
	public void onLoad() {
		super.setChatType(ChatType.GROUP);
	}
}