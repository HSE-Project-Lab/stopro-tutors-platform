package ru.stopro.dto.student;

import java.util.ArrayList;
import java.util.List;
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
	/** Первая группа ученика (legacy-поле для обратной совместимости) */
	private UUID groupId;
	/** Все группы, в которых состоит ученик */
	private List<UUID> groupIds;

	public static StudentDto fromEntity(User user, List<UUID> groupIds) {
		List<UUID> ids = groupIds != null ? groupIds : new ArrayList<>();
		return StudentDto.builder()
				.id(user.getId())
				.username(user.getUsername())
				.fullName(user.getFullName())
				.groupId(ids.isEmpty() ? null : ids.get(0))
				.groupIds(ids)
				.build();
	}

	/** Без группы (для списков, где группа неизвестна) */
	public static StudentDto fromEntity(User user) {
		return fromEntity(user, new ArrayList<>());
	}
}
