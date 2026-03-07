package ru.stopro.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.Attempt;
import ru.stopro.domain.enums.AttemptStatus;

/**
 * Репозиторий для работы с попытками прорешивания
 */
@Repository
public interface AttemptRepository extends JpaRepository<Attempt, UUID> {

	/**
	 * Все попытки ученика
	 */
	List<Attempt> findByStudent_IdAndIsDeletedFalse(UUID studentId);

	/**
	 * Попытки ученика с пагинацией
	 */
	Page<Attempt> findByStudent_IdAndIsDeletedFalseOrderByStartedAtDesc(UUID studentId, Pageable pageable);

	/**
	 * Попытки ученика по заданию
	 */
	List<Attempt> findByStudent_IdAndAssignment_IdAndIsDeletedFalse(UUID studentId, UUID assignmentId);

	/**
	 * Количество попыток ученика по заданию (для совместимости)
	 */
	long countByStudent_IdAndAssignment_Id(UUID studentId, UUID assignmentId);

	/**
	 * Попытки ученика отсортированные (для совместимости)
	 */
	List<Attempt> findByStudent_IdOrderByStartedAtDesc(UUID studentId);

	/**
	 * Попытки ученика по вопросу
	 */
	List<Attempt> findByStudent_IdAndQuestion_IdAndIsDeletedFalse(UUID studentId, UUID questionId);

	/**
	 * Последняя попытка ученика по вопросу
	 */
	@Query("SELECT a FROM Attempt a WHERE a.student.id = :studentId "
			+ "AND a.question.id = :questionId AND a.isDeleted = false " + "ORDER BY a.startedAt DESC")
	Optional<Attempt> findLatestByStudentAndQuestion(@Param("studentId") UUID studentId,
			@Param("questionId") UUID questionId);

	/**
	 * Лучшая попытка ученика по заданию
	 */
	@Query("SELECT a FROM Attempt a WHERE a.student.id = :studentId "
			+ "AND a.assignment.id = :assignmentId AND a.isDeleted = false " + "AND a.status = 'COMPLETED' "
			+ "ORDER BY a.pointsEarned DESC")
	List<Attempt> findBestByStudentAndAssignment(@Param("studentId") UUID studentId,
			@Param("assignmentId") UUID assignmentId, Pageable pageable);

	/**
	 * Все попытки по заданию
	 */
	List<Attempt> findByAssignment_IdAndIsDeletedFalse(UUID assignmentId);

	/**
	 * Завершённые попытки по заданию
	 */
	List<Attempt> findByAssignment_IdAndStatusAndIsDeletedFalse(UUID assignmentId, AttemptStatus status);

	/**
	 * Попытки, требующие проверки
	 */
	@Query("SELECT a FROM Attempt a WHERE a.assignment.id = :assignmentId "
			+ "AND a.status = 'NEEDS_REVIEW' AND a.isDeleted = false " + "ORDER BY a.answeredAt ASC")
	List<Attempt> findNeedingReviewByAssignment(@Param("assignmentId") UUID assignmentId);

	/**
	 * Количество завершивших задание
	 */
	@Query("SELECT COUNT(DISTINCT a.student.id) FROM Attempt a "
			+ "WHERE a.assignment.id = :assignmentId AND a.status = 'COMPLETED' " + "AND a.isDeleted = false")
	long countCompletedStudentsByAssignment(@Param("assignmentId") UUID assignmentId);

	/**
	 * Общая статистика ученика Возвращает: [total, correct, avgTime, totalPoints]
	 */
	@Query("SELECT COUNT(a), " + "SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0 END), " + "AVG(a.timeSpentSeconds), "
			+ "SUM(a.pointsEarned) " + "FROM Attempt a WHERE a.student.id = :studentId "
			+ "AND a.status = 'COMPLETED' AND a.isDeleted = false")
	Object[] getStudentOverallStats(@Param("studentId") UUID studentId);

	/**
	 * Статистика ученика за период
	 */
	@Query("SELECT COUNT(a), " + "SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0 END) "
			+ "FROM Attempt a WHERE a.student.id = :studentId " + "AND a.startedAt BETWEEN :startDate AND :endDate "
			+ "AND a.status = 'COMPLETED' AND a.isDeleted = false")
	Object[] getStudentStatsByPeriod(@Param("studentId") UUID studentId, @Param("startDate") LocalDateTime startDate,
			@Param("endDate") LocalDateTime endDate);

	/**
	 * Статистика по темам для ученика
	 */
	@Query("SELECT q.topic.id, q.topic.name, COUNT(a), " + "SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0 END) "
			+ "FROM Attempt a JOIN a.question q " + "WHERE a.student.id = :studentId AND a.status = 'COMPLETED' "
			+ "AND a.isDeleted = false " + "GROUP BY q.topic.id, q.topic.name")
	List<Object[]> getStudentStatsByTopic(@Param("studentId") UUID studentId);

	/**
	 * Статистика по номерам ЕГЭ для ученика
	 */
	@Query("SELECT q.egeNumber, COUNT(a), " + "SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0 END), "
			+ "AVG(a.timeSpentSeconds) " + "FROM Attempt a JOIN a.question q "
			+ "WHERE a.student.id = :studentId AND a.status = 'COMPLETED' " + "AND a.isDeleted = false "
			+ "GROUP BY q.egeNumber ORDER BY q.egeNumber")
	List<Object[]> getStudentStatsByEgeNumber(@Param("studentId") UUID studentId);

	/**
	 * Недельная активность ученика
	 */
	@Query("SELECT DATE(a.startedAt), COUNT(a), " + "SUM(CASE WHEN a.isCorrect = true THEN 1 ELSE 0 END) "
			+ "FROM Attempt a WHERE a.student.id = :studentId "
			+ "AND a.startedAt >= :startDate AND a.status = 'COMPLETED' " + "AND a.isDeleted = false "
			+ "GROUP BY DATE(a.startedAt) ORDER BY DATE(a.startedAt)")
	List<Object[]> getWeeklyActivity(@Param("studentId") UUID studentId, @Param("startDate") LocalDateTime startDate);

	/**
	 * Серия правильных ответов (streak)
	 */
	@Query("SELECT a FROM Attempt a WHERE a.student.id = :studentId "
			+ "AND a.status = 'COMPLETED' AND a.isDeleted = false " + "ORDER BY a.startedAt DESC")
	List<Attempt> findRecentForStreak(@Param("studentId") UUID studentId, Pageable pageable);

	/**
	 * Статистика по заданию [totalAttempts, completed, avgScore, avgTime]
	 */
	@Query("SELECT COUNT(a), " + "SUM(CASE WHEN a.status = 'COMPLETED' THEN 1 ELSE 0 END), "
			+ "AVG(CASE WHEN a.status = 'COMPLETED' THEN a.pointsEarned * 100.0 / a.maxPoints END), "
			+ "AVG(CASE WHEN a.status = 'COMPLETED' THEN a.timeSpentSeconds END) "
			+ "FROM Attempt a WHERE a.assignment.id = :assignmentId " + "AND a.isDeleted = false")
	Object[] getAssignmentStats(@Param("assignmentId") UUID assignmentId);

	/**
	 * Результаты всех учеников по заданию
	 */
	@Query("SELECT a.student.id, a.student.fullName, " + "MAX(a.pointsEarned), MAX(a.attemptNumber), MAX(a.answeredAt) "
			+ "FROM Attempt a WHERE a.assignment.id = :assignmentId "
			+ "AND a.status = 'COMPLETED' AND a.isDeleted = false " + "GROUP BY a.student.id, a.student.fullName")
	List<Object[]> getAssignmentResultsByStudent(@Param("assignmentId") UUID assignmentId);

	/**
	 * Подозрительные попытки
	 */
	@Query("SELECT a FROM Attempt a WHERE a.assignment.teacher.id = :teacherId "
			+ "AND a.isSuspicious = true AND a.isDeleted = false " + "ORDER BY a.startedAt DESC")
	List<Attempt> findSuspiciousByTeacher(@Param("teacherId") UUID teacherId, Pageable pageable);

	/**
	 * Попытки, ожидающие AI-проверки
	 */
	@Query("SELECT a FROM Attempt a WHERE a.aiCheckStatus = 'PENDING' "
			+ "AND a.isDeleted = false ORDER BY a.answeredAt ASC")
	List<Attempt> findPendingAiCheck(Pageable pageable);

	/**
	 * Попытки с ошибками AI-проверки
	 */
	@Query("SELECT a FROM Attempt a WHERE a.aiCheckStatus = 'FAILED' " + "AND a.isDeleted = false")
	List<Attempt> findFailedAiCheck();

	/**
	 * Обновить статус AI-проверки
	 */
	@Modifying
	@Query("UPDATE Attempt a SET a.aiCheckStatus = :status WHERE a.id = :id")
	void updateAiCheckStatus(@Param("id") UUID id, @Param("status") String status);

	/**
	 * Количество попыток ученика по заданию
	 */
	long countByStudent_IdAndAssignment_IdAndIsDeletedFalse(UUID studentId, UUID assignmentId);

	/**
	 * Количество правильных ответов ученика
	 */
	long countByStudent_IdAndIsCorrectTrueAndIsDeletedFalse(UUID studentId);

	/**
	 * Количество попыток, требующих проверки
	 */
	long countByStatusAndIsDeletedFalse(AttemptStatus status);

	/**
	 * Последние N попыток для анализа (AI рекомендации)
	 */
	@Query("SELECT a FROM Attempt a WHERE a.student.id = :studentId "
			+ "AND a.status = 'COMPLETED' AND a.isDeleted = false " + "ORDER BY a.startedAt DESC")
	List<Attempt> findRecentCompleted(@Param("studentId") UUID studentId, Pageable pageable);

	/**
	 * Прерванные попытки для очистки
	 */
	@Query("SELECT a FROM Attempt a WHERE a.status = 'IN_PROGRESS' "
			+ "AND a.startedAt < :threshold AND a.isDeleted = false")
	List<Attempt> findStaleInProgress(@Param("threshold") LocalDateTime threshold);

	/**
	 * Пометить прерванные попытки
	 */
	@Modifying
	@Query("UPDATE Attempt a SET a.status = 'INTERRUPTED', "
			+ "a.isInterrupted = true, a.interruptionReason = 'Timeout' "
			+ "WHERE a.status = 'IN_PROGRESS' AND a.startedAt < :threshold")
	int markStaleAsInterrupted(@Param("threshold") LocalDateTime threshold);
}
