package ru.stopro.domain.entity;

import java.util.Collection;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import ru.stopro.domain.enums.UserRole;

/**
 * Пользователь системы СТОПРО (ученик или учитель).
 */
@Entity
@Table(name = "users", indexes = {@Index(name = "idx_user_username", columnList = "username", unique = true),
		@Index(name = "idx_user_role", columnList = "role"),
		@Index(name = "idx_user_teacher", columnList = "teacher_id")})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity implements UserDetails {

	/** Уникальный логин (для учеников генерируется автоматически) */
	@Column(name = "username", nullable = false, unique = true, length = 100)
	private String username;

	/** Хеш пароля (BCrypt) */
	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	/** Роль: STUDENT, TEACHER, ADMIN */
	@Enumerated(EnumType.STRING)
	@Column(name = "role", nullable = false, length = 20)
	private UserRole role;

	/** ФИО пользователя */
	@Column(name = "full_name", nullable = false, length = 255)
	private String fullName;

	/** Согласие на обработку персональных данных (152-ФЗ) */
	@Column(name = "data_consent_status", nullable = false)
	@Builder.Default
	private Boolean dataConsentStatus = false;

	/** Учитель-репетитор (для учеников без группы) */
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "teacher_id")
	private User teacher;

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
	}

	@Override
	public String getPassword() {
		return passwordHash;
	}

	/** Возвращает username (логин) для Spring Security */
	@Override
	public String getUsername() {
		return username;
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}

	@Override
	public boolean isEnabled() {
		return !getIsDeleted();
	}
}
