package ru.stopro.repository.chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.ChatMessage;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {

	@Query("""
	            SELECT cm FROM ChatMessage cm
	            WHERE cm.chat.id = :chatId
	            AND cm.isDeleted = FALSE
	            ORDER BY cm.createdAt ASC
	            """)
	Page<ChatMessage> findByChatIdOrderByCreatedAtAsc(@Param("chatId") UUID chatId, Pageable pageable);

	List<ChatMessage> findByChatIdAndCreatedAtAfterOrderByCreatedAtAsc(UUID chatId, LocalDateTime createdAt);

	@Query(value = """
            SELECT cm.* FROM chat_messages cm
            WHERE cm.chat_id = :chatId
            AND to_tsvector('russian', cm.content_plain) @@ plainto_tsquery('russian', :query)
            AND cm.message_type = 'TEXT'
            AND cm.is_deleted = FALSE
            ORDER BY cm.created_at DESC
            """, nativeQuery = true)
	Page<ChatMessage> searchByContent(@Param("chatId") UUID chatId, @Param("query") String query, Pageable pageable);

	@Query("""
            SELECT COUNT(cm) FROM ChatMessage cm
            WHERE cm.chat.id = :chatId
            AND cm.createdAt > :lastReadTime
            AND cm.sender.id != :userId
            AND cm.messageType = 'TEXT'
            AND cm.isDeleted = FALSE
            """)
	Integer countUnreadMessages(@Param("chatId") UUID chatId, @Param("userId") UUID userId, @Param("lastReadTime") LocalDateTime lastReadTime);

	@Query("""
            SELECT cm FROM ChatMessage cm
            WHERE cm.chat.id = :chatId
            AND cm.pinnedBy IS NOT NULL
            AND cm.isDeleted = FALSE
            ORDER BY cm.pinnedAt DESC
            """)
	List<ChatMessage> findPinnedMessages(@Param("chatId") UUID chatId);

	@Query("""
            SELECT cm FROM ChatMessage cm
            WHERE cm.chat.id = :chatId
            AND cm.createdAt < :thresholdDate
            """)
	List<ChatMessage> findOldMessages(@Param("chatId") UUID chatId, @Param("thresholdDate") LocalDateTime thresholdDate);
}