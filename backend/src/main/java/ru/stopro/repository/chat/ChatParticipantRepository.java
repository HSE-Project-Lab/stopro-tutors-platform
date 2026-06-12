package ru.stopro.repository.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.ChatParticipant;

/**
 * Repository для работы с участниками чата.
 */
@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, UUID> {

	/**
	 * Найти запись участника в чате.
	 */
	@Query("""
		SELECT cp FROM ChatParticipant cp 
		WHERE cp.chat.id = :chatId 
		AND cp.user.id = :userId
		""")
	Optional<ChatParticipant> findByChatAndUser(@Param("chatId") UUID chatId, @Param("userId") UUID userId);

	/**
	 * Найти всех активных участников чата.
	 */
	@Query("""
		SELECT cp FROM ChatParticipant cp 
		WHERE cp.chat.id = :chatId 
		AND cp.leftAt IS NULL
		""")
	List<ChatParticipant> findActiveParticipants(@Param("chatId") UUID chatId);

	/**
	 * Найти всех участников чата (включая ушедших).
	 */
	List<ChatParticipant> findByChatId(UUID chatId);

	/**
	 * Найти все чаты, в которых участвует пользователь.
	 */
	@Query("""
		SELECT cp.chat.id FROM ChatParticipant cp
		WHERE cp.user.id = :userId
		AND cp.leftAt IS NULL
		""")
	List<UUID> findChatsForUser(@Param("userId") UUID userId);

	/**
	 * Проверить, участвует ли пользователь в чате.
	 */
	@Query("""
		SELECT COUNT(cp) > 0 FROM ChatParticipant cp 
		WHERE cp.chat.id = :chatId 
		AND cp.user.id = :userId
		AND cp.leftAt IS NULL
		""")
	boolean isUserInChat(@Param("chatId") UUID chatId, @Param("userId") UUID userId);
}

