package ru.stopro.dto.group;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Ответ с учётными данными всех добавленных учеников. Пароли возвращаются в
 * чистом виде один раз — учитель может их распечатать.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AddStudentsResponse {

	/** ID группы */
	private String groupId;

	/** Название группы */
	private String groupName;

	/** Список сгенерированных учётных данных */
	private List<StudentCredentials> credentials;
}
