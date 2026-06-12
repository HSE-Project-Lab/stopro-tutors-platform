package ru.stopro.repository.chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.ChatInactivityWarning;

/**
 * Repository для работы с предупреждениями об неактивности чатов.
 */
@Repository
public interface ChatInactivityWarningRepository extends JpaRepository<ChatInactivityWarning, UUID> {

	/**
	 * Найти неудаленные предупреждение для чата.
	 */
	@Query("""
		SELECT ciw FROM ChatInactivityWarning ciw
		WHERE ciw.chat.id = :chatId
		AND ciw.warningDismissed = FALSE
		ORDER BY ciw.warningSentAt DESC
		""")
	List<ChatInactivityWarning> findLatestActiveWarning(@Param("chatId") UUID chatId, Pageable pageable);

	/**
	 * Найти чаты, готовые к удалению (истекло запланированное время удаления).
	 */
	@Query("""
		SELECT ciw.chat.id FROM ChatInactivityWarning ciw 
		WHERE ciw.scheduledDeletionAt <= :now 
		AND ciw.warningDismissed = FALSE
		""")
	List<UUID> findChatsReadyForDeletion(@Param("now") LocalDateTime now);
}

