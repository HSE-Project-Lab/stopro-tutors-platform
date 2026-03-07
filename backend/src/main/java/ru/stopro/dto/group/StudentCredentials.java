package ru.stopro.dto.group;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Сгенерированные учётные данные одного ученика. Возвращается учителю для
 * распечатки / раздачи.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentCredentials {

	/** ФИО ученика */
	private String fullName;

	/** Сгенерированный логин */
	private String username;

	/** Чистый (не хешированный) временный пароль */
	private String password;
}
