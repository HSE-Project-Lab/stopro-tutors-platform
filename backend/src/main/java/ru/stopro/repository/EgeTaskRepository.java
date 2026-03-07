package ru.stopro.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.enums.TaskDifficulty;

public interface EgeTaskRepository extends JpaRepository<EgeTask, String> {

	@Query("""
			    SELECT t FROM EgeTask t
			    LEFT JOIN FETCH t.imageUrls
			    WHERE t.parent IS NULL
			      AND (:egeNumber IS NULL OR t.egeNumber = :egeNumber)
			      AND (:hasTopics = false OR t.topic IN :topics)
			      AND (:hasDifficulty = false OR t.difficulty = :difficulty)
			      AND (:hasSearch = false OR LOWER(t.content) LIKE LOWER(:search))
			    ORDER BY t.egeNumber ASC, t.createdAt DESC
			""")
	Page<EgeTask> findFiltered(@Param("egeNumber") Integer egeNumber, @Param("topics") List<String> topics,
			@Param("hasTopics") boolean hasTopics, @Param("difficulty") TaskDifficulty difficulty,
			@Param("hasDifficulty") boolean hasDifficulty, @Param("search") String search,
			@Param("hasSearch") boolean hasSearch, Pageable pageable);
}