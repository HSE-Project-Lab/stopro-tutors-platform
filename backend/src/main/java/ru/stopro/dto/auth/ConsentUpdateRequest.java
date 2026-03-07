package ru.stopro.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO для обновления согласий пользователя (152-ФЗ)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsentUpdateRequest {

	/**
	 * Согласие на обработку персональных данных ВАЖНО: Отзыв приводит к деактивации
	 * аккаунта!
	 */
	private Boolean dataProcessingConsent;

	/**
	 * Согласие на получение маркетинговых рассылок
	 */
	private Boolean marketingConsent;

	/**
	 * Согласие на использование cookies
	 */
	private Boolean cookiesConsent;
}
