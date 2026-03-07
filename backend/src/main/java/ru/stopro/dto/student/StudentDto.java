package ru.stopro.dto.student;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.entity.User;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDto {
	private UUID id;
	private String username;
	private String fullName;
	/** ID группы (если ученик в группе) */
	private UUID groupId;

	public static StudentDto fromEntity(User user, UUID groupId) {
		return StudentDto.builder().id(user.getId()).username(user.getUsername()).fullName(user.getFullName())
				.groupId(groupId).build();
	}

	/** Без группы (для списков, где группа неизвестна) */
	public static StudentDto fromEntity(User user) {
		return fromEntity(user, null);
	}
}
