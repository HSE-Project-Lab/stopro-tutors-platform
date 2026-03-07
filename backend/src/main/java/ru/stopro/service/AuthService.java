package ru.stopro.service;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.UserRole;
import ru.stopro.dto.auth.*;
import ru.stopro.repository.UserRepository;
import ru.stopro.security.JwtService;

@Service
@RequiredArgsConstructor
public class AuthService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final AuthenticationManager authenticationManager;

	@Transactional
	public AuthResponse register(RegisterRequest request) {
		if (userRepository.existsByUsername(request.getUsername())) {
			throw new RuntimeException("Username already exists");
		}

		var user = User.builder().username(request.getUsername())
				.passwordHash(passwordEncoder.encode(request.getPassword())).fullName(request.getFullName())
				.role(request.getRole() != null ? request.getRole() : UserRole.STUDENT)
				.dataConsentStatus(request.isDataProcessingConsent()).build();

		userRepository.save(user);

		var accessToken = jwtService.generateToken(user);
		var refreshToken = jwtService.generateRefreshToken(user);

		return AuthResponse.builder().accessToken(accessToken).refreshToken(refreshToken).user(mapToDto(user)).build();
	}

	public AuthResponse login(LoginRequest request) {
		authenticationManager
				.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

		var user = userRepository.findByUsername(request.getUsername())
				.orElseThrow(() -> new RuntimeException("User not found"));

		var accessToken = jwtService.generateToken(user);
		var refreshToken = jwtService.generateRefreshToken(user);

		return AuthResponse.builder().accessToken(accessToken).refreshToken(refreshToken).user(mapToDto(user)).build();
	}

	public AuthResponse refreshToken(RefreshTokenRequest request) {
		String refreshToken = request.getRefreshToken();
		String username = jwtService.extractUsername(refreshToken);

		if (username != null) {
			var user = userRepository.findByUsername(username)
					.orElseThrow(() -> new RuntimeException("User not found"));

			if (jwtService.isTokenValid(refreshToken, user)) {
				var accessToken = jwtService.generateToken(user);
				return AuthResponse.builder().accessToken(accessToken).refreshToken(refreshToken).user(mapToDto(user))
						.build();
			}
		}
		throw new RuntimeException("Invalid refresh token");
	}

	public UserDto getCurrentUser(String username) {
		var user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
		return mapToDto(user);
	}

	public void logout(String authHeader) {
	}

	/**
	 * Отозвать согласие на обработку ПД
	 */
	@Transactional
	public void revokeConsent(String username, String password) {
		var user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

		if (!passwordEncoder.matches(password, user.getPasswordHash())) {
			throw new RuntimeException("Invalid password");
		}

		user.setDataConsentStatus(false);
		userRepository.save(user);
	}

	/**
	 * Экспортировать данные пользователя
	 */
	public DataExportResponse exportUserData(String username) {
		var user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

		return DataExportResponse.builder().userId(user.getId().toString()).username(user.getUsername())
				.fullName(user.getFullName()).role(user.getRole() != null ? user.getRole().name() : "UNKNOWN")
				.registeredAt(user.getCreatedAt()).exportDate(java.time.LocalDateTime.now()).build();
	}

	private UserDto mapToDto(User user) {
		return UserDto.builder().id(user.getId().toString()).username(user.getUsername()).fullName(user.getFullName())
				.role(user.getRole()).build();
	}
}
