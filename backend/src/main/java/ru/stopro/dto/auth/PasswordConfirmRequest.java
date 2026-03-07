package ru.stopro.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordConfirmRequest {
	@NotBlank(message = "Password confirmation is required")
	private String password;
}
