package ru.stopro.repository.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.MessageReadReceipt;

/**
 * Repository для работы с информацией о прочтении сообщений.
 */
@Repository
public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, UUID> {

	/**
	 * Найти информацию о прочтении сообщения пользователем.
	 */
	@Query("""
		SELECT mrr FROM MessageReadReceipt mrr 
		WHERE mrr.message.id = :messageId 
		AND mrr.user.id = :userId
		""")
	Optional<MessageReadReceipt> findByMessageAndUser(@Param("messageId") UUID messageId, @Param("userId") UUID userId);

	/**
	 * Найти всех пользователей, которые прочитали сообщение.
	 */
	List<MessageReadReceipt> findByMessageId(UUID messageId);

	/**
	 * Проверить, прочитано ли сообщение пользователем.
	 */
	@Query("""
		SELECT COUNT(mrr) > 0 FROM MessageReadReceipt mrr 
		WHERE mrr.message.id = :messageId 
		AND mrr.user.id = :userId
		""")
	boolean isMessageReadByUser(@Param("messageId") UUID messageId, @Param("userId") UUID userId);
}

