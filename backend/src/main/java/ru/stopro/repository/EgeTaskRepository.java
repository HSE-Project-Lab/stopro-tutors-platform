// backend/src/main/java/ru/stopro/repository/EgeTaskRepository.java

package ru.stopro.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.enums.TaskDifficulty;

import java.util.List;

public interface EgeTaskRepository extends JpaRepository<EgeTask, String> {

    @Query("""
        SELECT t FROM EgeTask t
        WHERE (:egeNumber IS NULL OR t.egeNumber = :egeNumber)
          AND (:topics IS NULL OR t.topic IN :topics)
          AND (:difficulty IS NULL OR t.difficulty = :difficulty)
          AND (:search IS NULL OR LOWER(t.content) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY t.egeNumber ASC, t.createdAt DESC
    """)
    Page<EgeTask> findFiltered(
        @Param("egeNumber") Integer egeNumber,
        @Param("topics") List<String> topics,
        @Param("difficulty") TaskDifficulty difficulty,
        @Param("search") String search,
        Pageable pageable
    );
}