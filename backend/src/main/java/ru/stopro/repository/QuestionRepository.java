package ru.stopro.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.Question;
import ru.stopro.domain.enums.QuestionType;
import ru.stopro.domain.enums.TaskDifficulty;

/**
 * Репозиторий для работы с вопросами (авторская база задач)
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {

	/**
	 * Активные вопросы по теме
	 */
	List<Question> findByTopicIdAndIsActiveTrueAndIsDeletedFalse(UUID topicId);

	/**
	 * Вопросы по номеру задания ЕГЭ
	 */
	List<Question> findByEgeNumberAndIsActiveTrueAndIsDeletedFalse(Integer egeNumber);

	/**
	 * Вопросы по номеру ЕГЭ (для совместимости)
	 */
	List<Question> findByEgeNumberAndIsDeletedFalse(Integer egeNumber);

	/**
	 * Вопросы по сложности (для совместимости)
	 */
	List<Question> findByDifficultyAndIsDeletedFalse(TaskDifficulty difficulty);

	/**
	 * Случайные вопросы (для совместимости)
	 */
	@Query(value = "SELECT * FROM questions q WHERE q.is_active = true AND q.is_deleted = false "
			+ "ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
	List<Question> findRandomQuestions(@Param("limit") int limit);

	/**
	 * Вопросы создателя (автора)
	 */
	Page<Question> findByAuthorIdAndIsDeletedFalse(UUID authorId, Pageable pageable);

	/**
	 * Вопросы по теме (для совместимости)
	 */
	Page<Question> findByTopicIdAndIsDeletedFalse(UUID topicId, Pageable pageable);

	/**
	 * Вопросы по сложности с пагинацией (для совместимости)
	 */
	Page<Question> findByDifficultyAndIsDeletedFalse(TaskDifficulty difficulty, Pageable pageable);

	/**
	 * Все активные вопросы (для совместимости)
	 */
	Page<Question> findByIsDeletedFalse(Pageable pageable);

	/**
	 * Публичные (активные) вопросы
	 */
	Page<Question> findByIsActiveTrueAndIsDeletedFalse(Pageable pageable);

	/**
	 * Вопросы по сложности
	 */
	Page<Question> findByDifficultyAndIsActiveTrueAndIsDeletedFalse(TaskDifficulty difficulty, Pageable pageable);

	/**
	 * Вопросы по типу
	 */
	Page<Question> findByQuestionTypeAndIsActiveTrueAndIsDeletedFalse(QuestionType type, Pageable pageable);

	/**
	 * Верифицированные вопросы
	 */
	Page<Question> findByIsVerifiedTrueAndIsActiveTrueAndIsDeletedFalse(Pageable pageable);

	/**
	 * Поиск с множественными фильтрами
	 */
	@Query("SELECT q FROM Question q WHERE q.isActive = true AND q.isDeleted = false "
			+ "AND (:topicId IS NULL OR q.topic.id = :topicId) "
			+ "AND (:egeNumber IS NULL OR q.egeNumber = :egeNumber) "
			+ "AND (:difficulty IS NULL OR q.difficulty = :difficulty) "
			+ "AND (:questionType IS NULL OR q.questionType = :questionType) "
			+ "AND (:isVerified IS NULL OR q.isVerified = :isVerified)")
	Page<Question> findWithFilters(@Param("topicId") UUID topicId, @Param("egeNumber") Integer egeNumber,
			@Param("difficulty") TaskDifficulty difficulty, @Param("questionType") QuestionType questionType,
			@Param("isVerified") Boolean isVerified, Pageable pageable);

	/**
	 * Полнотекстовый поиск по содержимому
	 */
	@Query("SELECT q FROM Question q WHERE q.isActive = true AND q.isDeleted = false "
			+ "AND (LOWER(q.content) LIKE LOWER(CONCAT('%', :query, '%')) "
			+ "OR LOWER(q.contentPlain) LIKE LOWER(CONCAT('%', :query, '%')) "
			+ "OR LOWER(q.solution) LIKE LOWER(CONCAT('%', :query, '%')) "
			+ "OR LOWER(q.keywords) LIKE LOWER(CONCAT('%', :query, '%')))")
	Page<Question> searchByContent(@Param("query") String query, Pageable pageable);

	/**
	 * Случайные вопросы по номеру ЕГЭ для генерации варианта
	 */
	@Query(value = "SELECT * FROM questions q WHERE q.is_active = true AND q.is_deleted = false "
			+ "AND q.ege_number = :egeNumber " + "ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
	List<Question> findRandomByEgeNumber(@Param("egeNumber") Integer egeNumber, @Param("limit") int limit);

	/**
	 * Случайные вопросы по теме и сложности
	 */
	@Query(value = "SELECT * FROM questions q WHERE q.is_active = true AND q.is_deleted = false "
			+ "AND q.topic_id = :topicId AND q.difficulty = :difficulty "
			+ "ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
	List<Question> findRandomByTopicAndDifficulty(@Param("topicId") UUID topicId,
			@Param("difficulty") String difficulty, @Param("limit") int limit);

	/**
	 * Вопросы, которые ученик ещё не решал
	 */
	@Query("SELECT q FROM Question q WHERE q.isActive = true AND q.isDeleted = false " + "AND q.topic.id = :topicId "
			+ "AND q.id NOT IN (SELECT a.question.id FROM Attempt a WHERE a.student.id = :studentId)")
	List<Question> findUnsolvedByStudent(@Param("studentId") UUID studentId, @Param("topicId") UUID topicId);

	/**
	 * Вопросы, которые ученик решил неправильно (для повторения)
	 */
	@Query("SELECT DISTINCT q FROM Question q " + "JOIN Attempt a ON a.question = q "
			+ "WHERE a.student.id = :studentId AND a.isCorrect = false "
			+ "AND q.isActive = true AND q.isDeleted = false")
	List<Question> findIncorrectlySolvedByStudent(@Param("studentId") UUID studentId, Pageable pageable);

	/**
	 * Рекомендованные вопросы на основе неправильных попыток ученика
	 */
	@Query("SELECT q FROM Question q WHERE q.isActive = true AND q.isDeleted = false " + "AND q.topic.id IN ("
			+ "  SELECT DISTINCT a.question.topic.id FROM Attempt a "
			+ "  WHERE a.student.id = :studentId AND a.isCorrect = false" + ") ORDER BY q.difficulty ASC")
	List<Question> findRecommendedForStudent(@Param("studentId") UUID studentId, Pageable pageable);

	/**
	 * Подсчёт вопросов по номеру ЕГЭ
	 */
	long countByEgeNumberAndIsActiveTrueAndIsDeletedFalse(Integer egeNumber);

	/**
	 * Подсчёт вопросов по теме
	 */
	long countByTopicIdAndIsActiveTrueAndIsDeletedFalse(UUID topicId);

	/**
	 * Подсчёт неверифицированных вопросов
	 */
	long countByIsVerifiedFalseAndIsActiveTrueAndIsDeletedFalse();

	/**
	 * Самые сложные вопросы (низкий success rate)
	 */
	@Query("SELECT q FROM Question q WHERE q.isActive = true AND q.isDeleted = false " + "AND q.timesAttempted > 10 "
			+ "ORDER BY (CAST(q.timesCorrect AS double) / q.timesAttempted) ASC")
	List<Question> findHardestQuestions(Pageable pageable);

	/**
	 * Самые популярные вопросы
	 */
	@Query("SELECT q FROM Question q WHERE q.isActive = true AND q.isDeleted = false "
			+ "ORDER BY q.timesAttempted DESC")
	List<Question> findMostPopular(Pageable pageable);

	/**
	 * Найти все версии вопроса
	 */
	@Query("SELECT q FROM Question q WHERE q.parentQuestionId = :parentId OR q.id = :parentId "
			+ "ORDER BY q.questionVersion ASC")
	List<Question> findAllVersions(@Param("parentId") UUID parentQuestionId);

	/**
	 * Найти последнюю версию
	 */
	@Query("SELECT q FROM Question q WHERE q.parentQuestionId = :parentId AND q.isLatestVersion = true")
	Question findLatestVersion(@Param("parentId") UUID parentQuestionId);

	/**
	 * Инкремент показов
	 */
	@Modifying
	@Query("UPDATE Question q SET q.timesShown = q.timesShown + 1 WHERE q.id = :id")
	void incrementTimesShown(@Param("id") UUID id);

	/**
	 * Обновление статистики после попытки
	 */
	@Modifying
	@Query("UPDATE Question q SET " + "q.timesAttempted = q.timesAttempted + 1, "
			+ "q.timesCorrect = q.timesCorrect + CASE WHEN :isCorrect = true THEN 1 ELSE 0 END " + "WHERE q.id = :id")
	void updateStatistics(@Param("id") UUID id, @Param("isCorrect") boolean isCorrect);
}
