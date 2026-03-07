package ru.stopro.dto.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ответ с информацией о группе
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupResponse {

	private String id;
	private String name;
	private String teacherId;
	private String inviteCode;
	private int studentsCount;
}
