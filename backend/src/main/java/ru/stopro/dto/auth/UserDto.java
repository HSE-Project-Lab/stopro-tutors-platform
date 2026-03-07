package ru.stopro.dto.auth;

import lombok.Builder;
import lombok.Data;

import ru.stopro.domain.enums.UserRole;

@Data
@Builder
public class UserDto {
	private String id;
	private String username;
	private String fullName;
	private UserRole role;
}
