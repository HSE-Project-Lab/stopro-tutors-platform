package ru.stopro.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.AchievementDefinition;

@Repository
public interface AchievementDefinitionRepository extends JpaRepository<AchievementDefinition, String> {

	List<AchievementDefinition> findByIsActiveTrueOrderBySortOrderAscKeyAsc();

	Optional<AchievementDefinition> findByKeyAndIsActiveTrue(String key);
}
