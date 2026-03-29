package ru.stopro.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.StudentAchievementProgress;

@Repository
public interface StudentAchievementProgressRepository extends JpaRepository<StudentAchievementProgress, UUID> {

	Optional<StudentAchievementProgress> findByStudent_IdAndAchievement_Key(UUID studentId, String achievementKey);

	List<StudentAchievementProgress> findByStudent_IdAndIsDeletedFalse(UUID studentId);
}
