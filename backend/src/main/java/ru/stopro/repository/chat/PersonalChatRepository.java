package ru.stopro.repository.chat;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.PersonalChat;

@Repository
public interface PersonalChatRepository extends JpaRepository<PersonalChat, UUID> {

	@Query("""
            SELECT pc FROM PersonalChat pc
            WHERE pc.teacher.id = :teacherId
            AND pc.student.id = :studentId
            """)
	Optional<PersonalChat> findByTeacherAndStudent(@Param("teacherId") UUID teacherId,
												   @Param("studentId") UUID studentId);

	@Query("""
            SELECT COUNT(pc) > 0 FROM PersonalChat pc
            WHERE pc.teacher.id = :teacherId
            AND pc.student.id = :studentId
            """)
	boolean existsByTeacherAndStudent(@Param("teacherId") UUID teacherId,
									  @Param("studentId") UUID studentId);
}