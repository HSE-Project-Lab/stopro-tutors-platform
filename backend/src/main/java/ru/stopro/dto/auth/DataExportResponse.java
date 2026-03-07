package ru.stopro.dto.auth;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DataExportResponse {
	private String userId;
	private String username;
	private String fullName;
	private String role;
	private LocalDateTime registeredAt;
	private LocalDateTime exportDate;
}
