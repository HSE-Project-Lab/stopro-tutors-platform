package ru.stopro.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.StudyGroup;

/**
 * Репозиторий для работы с учебными группами
 */
@Repository
public interface StudyGroupRepository extends JpaRepository<StudyGroup, UUID> {

	/** Все группы конкретного учителя */
	List<StudyGroup> findByTeacherId(UUID teacherId);

	/** Поиск группы по коду-приглашению */
	Optional<StudyGroup> findByInviteCode(String inviteCode);

	/** Проверка существования кода-приглашения */
	boolean existsByInviteCode(String inviteCode);
}
