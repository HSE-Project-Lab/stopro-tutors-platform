package ru.stopro.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.UserRole;

/**
 * Репозиторий для работы с пользователями
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

	/** Поиск пользователя по логину */
	Optional<User> findByUsername(String username);

	/** Проверка существования логина */
	boolean existsByUsername(String username);

	/** Поиск пользователей по роли */
	List<User> findByRole(UserRole role);

	/** Ученики, привязанные к учителю без группы (teacher_id = ...) */
	List<User> findByTeacherIdAndRoleAndIsDeletedFalse(UUID teacherId, UserRole role);
}
