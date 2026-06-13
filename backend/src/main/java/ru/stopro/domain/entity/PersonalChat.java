package ru.stopro.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import ru.stopro.domain.enums.ChatType;

@Entity
@DiscriminatorValue("PERSONAL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PersonalChat extends Chat {

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "student_id")
	private User student;

	@PostLoad
	public void onLoad() {
		super.setChatType(ChatType.PERSONAL);
	}
}