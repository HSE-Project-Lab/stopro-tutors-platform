package ru.stopro.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import ru.stopro.domain.enums.UserRole;

@Data
public class RegisterRequest {
	@NotBlank(message = "Username is required")
	private String username;

	@NotBlank(message = "Password is required")
	@Size(min = 6, message = "Password must be at least 6 characters")
	private String password;

	@NotBlank(message = "Full name is required")
	private String fullName;

	@NotNull(message = "Role is required")
	private UserRole role;

	/** Согласие на обработку ПД (152-ФЗ) */
	private boolean dataProcessingConsent;
}
