package ru.stopro.dto.group;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Запрос на создание учебной группы
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateGroupRequest {

	@NotBlank(message = "Название группы обязательно")
	@Size(min = 2, max = 255, message = "Название от 2 до 255 символов")
	private String name;
}
