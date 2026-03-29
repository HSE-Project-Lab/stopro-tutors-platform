package ru.stopro.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.StudentAchievementEvent;
import ru.stopro.domain.enums.AchievementEventType;

@Repository
public interface StudentAchievementEventRepository extends JpaRepository<StudentAchievementEvent, UUID> {

	boolean existsByStudent_IdAndEventTypeAndEventDate(UUID studentId, AchievementEventType eventType,
			LocalDate eventDate);

	List<StudentAchievementEvent> findByStudent_IdAndIsDeletedFalseOrderByEventAtDesc(UUID studentId);
}
