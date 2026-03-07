package ru.stopro.controller;

import java.util.HashMap;
import java.util.Map;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import ru.stopro.dto.auth.AuthResponse;
import ru.stopro.dto.auth.DataExportResponse;
import ru.stopro.dto.auth.LoginRequest;
import ru.stopro.dto.auth.PasswordConfirmRequest;
import ru.stopro.dto.auth.RefreshTokenRequest;
import ru.stopro.dto.auth.RegisterRequest;
import ru.stopro.dto.auth.UserDto;
import ru.stopro.service.AuthService;

/**
 * Контроллер аутентификации и авторизации
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "API для регистрации, входа и управления сессией")
public class AuthController {

	private final AuthService authService;

	@Operation(summary = "Регистрация", description = "Создаёт нового пользователя в системе")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Успешная регистрация"),
			@ApiResponse(responseCode = "400", description = "Username уже используется")})
	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		log.info("Registration attempt for username: {}", request.getUsername());
		AuthResponse response = authService.register(request);
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Вход", description = "Аутентификация пользователя")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Успешный вход"),
			@ApiResponse(responseCode = "401", description = "Неверные учётные данные")})
	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		log.info("Login attempt for username: {}", request.getUsername());
		AuthResponse response = authService.login(request);
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Обновить токен", description = "Получение нового access token по refresh token")
	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
		AuthResponse response = authService.refreshToken(request);
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Текущий пользователь", description = "Возвращает данные авторизованного пользователя")
	@GetMapping("/me")
	public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
		UserDto user = authService.getCurrentUser(userDetails.getUsername());
		return ResponseEntity.ok(user);
	}

	@Operation(summary = "Выход", description = "Инвалидирует текущую сессию")
	@PostMapping("/logout")
	public ResponseEntity<Map<String, String>> logout(@AuthenticationPrincipal UserDetails userDetails) {
		log.info("Logout for user: {}", userDetails.getUsername());
		Map<String, String> response = new HashMap<>();
		response.put("message", "Успешный выход из системы");
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Проверить токен", description = "Проверяет, валиден ли текущий токен")
	@GetMapping("/validate")
	public ResponseEntity<Map<String, Boolean>> validateToken(@AuthenticationPrincipal UserDetails userDetails) {
		Map<String, Boolean> response = new HashMap<>();
		response.put("valid", userDetails != null);
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Health Check", description = "Проверка работоспособности сервиса авторизации")
	@GetMapping("/health")
	public ResponseEntity<Map<String, String>> health() {
		Map<String, String> response = new HashMap<>();
		response.put("status", "OK");
		response.put("service", "auth");
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Отзыв согласия", description = "Отзывает согласие на обработку персональных данных")
	@PostMapping("/revoke-consent")
	public ResponseEntity<Map<String, String>> revokeConsent(@Valid @RequestBody PasswordConfirmRequest request,
			@AuthenticationPrincipal UserDetails userDetails) {
		authService.revokeConsent(userDetails.getUsername(), request.getPassword());
		Map<String, String> response = new HashMap<>();
		response.put("message", "Согласие на обработку данных отозвано");
		return ResponseEntity.ok(response);
	}

	@Operation(summary = "Экспорт данных", description = "Экспортирует все персональные данные пользователя")
	@GetMapping("/export-data")
	public ResponseEntity<DataExportResponse> exportData(@AuthenticationPrincipal UserDetails userDetails) {
		DataExportResponse data = authService.exportUserData(userDetails.getUsername());
		return ResponseEntity.ok(data);
	}
}
