package ru.stopro.repository.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.Chat;
import ru.stopro.domain.enums.ChatStatus;

/**
 * Repository для работы с чатами.
 */
@Repository
public interface ChatRepository extends JpaRepository<Chat, UUID> {

	/**
	 * Найти все чаты преподавателя.
	 */
	List<Chat> findByTeacherId(UUID teacherId);

	/**
	 * Найти чаты преподавателя с определенным статусом.
	 */
	List<Chat> findByTeacherIdAndStatus(UUID teacherId, ChatStatus status);

	/**
	 * Найти личные и групповые чаты преподавателя.
	 */
	@Query("""
		SELECT c FROM Chat c 
		WHERE c.teacher.id = :teacherId 
		AND c.status = 'ACTIVE'
		ORDER BY c.lastMessageAt DESC
		""")
	List<Chat> findActiveChats(@Param("teacherId") UUID teacherId);

	/**
	 * Найти чаты, ожидающие удаления (для автоматического удаления через неделю).
	 */
	@Query("""
		SELECT c FROM Chat c 
		WHERE c.status = 'PENDING_DELETION'
		""")
	List<Chat> findChatsPendingDeletion();
}

