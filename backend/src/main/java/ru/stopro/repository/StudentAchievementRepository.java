package ru.stopro.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.StudentAchievement;

@Repository
public interface StudentAchievementRepository extends JpaRepository<StudentAchievement, UUID> {

	boolean existsByStudent_IdAndAchievement_Key(UUID studentId, String achievementKey);

	List<StudentAchievement> findByStudent_IdAndIsDeletedFalse(UUID studentId);
}
