package ru.stopro.repository.chat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.GroupChat;

@Repository
public interface GroupChatRepository extends JpaRepository<GroupChat, UUID> {

	@Query("""
            SELECT gc FROM GroupChat gc
            WHERE gc.studyGroup.id = :studyGroupId
            """)
	Optional<GroupChat> findByStudyGroupId(@Param("studyGroupId") UUID studyGroupId);

	@Query("""
            SELECT MAX(gc.nextGroupNumber)
            FROM GroupChat gc
            WHERE gc.teacher.id = :teacherId
            AND gc.chatName LIKE 'Группа %'
            """)
	Optional<Integer> findMaxGroupNumber(@Param("teacherId") UUID teacherId);

	@Query("""
            SELECT gc FROM GroupChat gc
            WHERE gc.teacher.id = :teacherId
            ORDER BY gc.lastMessageAt DESC
            """)
	List<GroupChat> findByTeacherId(@Param("teacherId") UUID teacherId);
}