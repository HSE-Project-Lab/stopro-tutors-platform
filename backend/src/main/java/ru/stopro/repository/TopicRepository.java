package ru.stopro.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.Topic;

/**
 * Репозиторий для работы с темами
 */
@Repository
public interface TopicRepository extends JpaRepository<Topic, UUID> {

	/**
	 * Поиск тем по номеру ЕГЭ
	 */
	List<Topic> findByEgeNumber(Integer egeNumber);

	/**
	 * Поиск активных тем
	 */
	List<Topic> findByIsActiveTrueOrderByOrderIndexAsc();

	/**
	 * Поиск корневых тем
	 */
	List<Topic> findByParentIdIsNullOrderByOrderIndexAsc();
}
