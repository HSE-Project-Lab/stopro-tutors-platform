package ru.stopro.dto.group;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Запрос на массовое добавление учеников в группу. Содержит список ФИО
 * учеников.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddStudentsRequest {

	@NotEmpty(message = "Список учеников не может быть пустым")
	private List<String> studentNames;
}
