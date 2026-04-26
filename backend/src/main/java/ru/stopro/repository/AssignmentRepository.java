package ru.stopro.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.enums.AssignmentStatus;
import ru.stopro.domain.enums.AssignmentType;

/**
 * Репозиторий для работы с назначенными заданиями
 */
@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, UUID> {

	/**
	 * Все задания учителя
	 */
	List<Assignment> findByTeacherIdAndIsDeletedFalse(UUID teacherId);

	/**
	 * Задания создателя (для совместимости)
	 */
	List<Assignment> findByCreatedByIdOrderByCreatedAtDesc(UUID createdById);

	/**
	 * Задания группы (для совместимости)
	 */
	List<Assignment> findByGroupIdOrderByDeadlineAsc(UUID groupId);

	/**
	 * Задания учителя с пагинацией
	 */
	Page<Assignment> findByTeacherIdAndIsDeletedFalseOrderByDeadlineDesc(UUID teacherId, Pageable pageable);

	/**
	 * Задания учителя по статусу
	 */
	List<Assignment> findByTeacherIdAndStatusAndIsDeletedFalse(UUID teacherId, AssignmentStatus status);

	/**
	 * Задания учителя по типу
	 */
	List<Assignment> findByTeacherIdAndAssignmentTypeAndIsDeletedFalse(UUID teacherId, AssignmentType type);

	/**
	 * Активные задания учителя
	 */
	@Query("SELECT a FROM Assignment a WHERE a.teacher.id = :teacherId "
			+ "AND a.status = 'PUBLISHED' AND a.deadline > CURRENT_TIMESTAMP "
			+ "AND a.isDeleted = false ORDER BY a.deadline ASC")
	List<Assignment> findActiveByTeacher(@Param("teacherId") UUID teacherId);

	/**
	 * Задания группы
	 */
	List<Assignment> findByGroupIdAndIsDeletedFalse(UUID groupId);

	/**
	 * Активные задания группы
	 */
	List<Assignment> findByGroupIdAndStatusAndIsDeletedFalse(UUID groupId, AssignmentStatus status);

	/**
	 * Ближайшие дедлайны группы
	 */
	@Query("SELECT a FROM Assignment a WHERE a.group.id = :groupId "
			+ "AND a.status = 'PUBLISHED' AND a.deadline > CURRENT_TIMESTAMP "
			+ "AND a.isDeleted = false ORDER BY a.deadline ASC")
	List<Assignment> findUpcomingDeadlinesForGroup(@Param("groupId") UUID groupId, Pageable pageable);

	/**
	 * Активные задания для ученика (через группу ИЛИ лично)
	 */
	@Query("SELECT DISTINCT a FROM Assignment a " + "LEFT JOIN a.group g " + "LEFT JOIN g.students s "
			+ "WHERE (s.id = :studentId OR a.student.id = :studentId) "
			+ "AND (a.status = 'PUBLISHED' OR a.status = 'ACTIVE' OR a.status = 'IN_PROGRESS') "
			+ "AND (a.startDate IS NULL OR a.startDate <= CURRENT_TIMESTAMP) " + "AND a.deadline > CURRENT_TIMESTAMP "
			+ "AND a.isDeleted = false " + "ORDER BY a.deadline ASC")
	List<Assignment> findActiveForStudent(@Param("studentId") UUID studentId);

	@Query("SELECT DISTINCT a FROM Assignment a " + "LEFT JOIN a.group g " + "LEFT JOIN g.students s "
			+ "WHERE (s.id = :studentId OR a.student.id = :studentId) " + "AND a.isDeleted = false "
			+ "ORDER BY a.deadline DESC")
	Page<Assignment> findAllForStudent(@Param("studentId") UUID studentId, Pageable pageable);

	/**
	 * Задания ученика с невыполненными попытками
	 */
	@Query("SELECT DISTINCT a FROM Assignment a " + "LEFT JOIN a.group g " + "LEFT JOIN g.students s "
			+ "WHERE (s.id = :studentId OR a.student.id = :studentId) " + "AND a.status = 'PUBLISHED' "
			+ "AND a.isDeleted = false " + "AND NOT EXISTS (" + "  SELECT att FROM Attempt att "
			+ "  WHERE att.assignment = a AND att.student.id = :studentId AND att.status = 'COMPLETED'" + ") "
			+ "ORDER BY a.deadline ASC")
	List<Assignment> findPendingForStudent(@Param("studentId") UUID studentId);

	/**
	 * Выполненные задания ученика
	 */
	@Query("SELECT DISTINCT a FROM Assignment a " + "JOIN Attempt att ON att.assignment = a "
			+ "WHERE att.student.id = :studentId AND att.status = 'COMPLETED' " + "AND a.isDeleted = false "
			+ "ORDER BY a.deadline DESC")
	Page<Assignment> findCompletedByStudent(@Param("studentId") UUID studentId, Pageable pageable);

	@Query("SELECT DISTINCT a FROM Assignment a " + "JOIN Attempt att ON att.assignment = a "
			+ "WHERE att.student.id = :studentId AND att.status = 'COMPLETED' " + "AND a.isDeleted = false "
			+ "ORDER BY a.deadline DESC")
	List<Assignment> findCompletedListByStudent(@Param("studentId") UUID studentId);

	@Query("SELECT DISTINCT a FROM Assignment a " + "LEFT JOIN a.group g " + "LEFT JOIN g.students s "
			+ "WHERE (s.id = :studentId OR a.student.id = :studentId) " + "AND a.status = 'COMPLETED' "
			+ "AND a.isDeleted = false " + "ORDER BY a.deadline DESC")
	List<Assignment> findCompletedAssignedForStudent(@Param("studentId") UUID studentId);

	/**
	 * Задания с истёкшим дедлайном (для автообновления статуса)
	 */
	@Query("SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' " + "AND a.deadline < :now AND a.isDeleted = false")
	List<Assignment> findOverdueAssignments(@Param("now") LocalDateTime now);

	/**
	 * Задания для напоминания о дедлайне
	 */
	@Query("SELECT a FROM Assignment a WHERE a.status = 'PUBLISHED' " + "AND a.sendDeadlineReminder = true "
			+ "AND a.deadline BETWEEN :now AND :reminderTime " + "AND a.isDeleted = false")
	List<Assignment> findForDeadlineReminder(@Param("now") LocalDateTime now,
			@Param("reminderTime") LocalDateTime reminderTime);

	/**
	 * Запланированные задания для публикации
	 */
	@Query("SELECT a FROM Assignment a WHERE a.status = 'SCHEDULED' "
			+ "AND a.startDate <= :now AND a.isDeleted = false")
	List<Assignment> findScheduledForPublishing(@Param("now") LocalDateTime now);

	/**
	 * Поиск с множественными фильтрами
	 */
	@Query("SELECT a FROM Assignment a WHERE a.teacher.id = :teacherId " + "AND a.isDeleted = false "
			+ "AND (:status IS NULL OR a.status = :status) " + "AND (:type IS NULL OR a.assignmentType = :type) "
			+ "AND (:groupId IS NULL OR (a.group IS NOT NULL AND a.group.id = :groupId)) "
			+ "AND (:fromDate IS NULL OR a.deadline >= :fromDate) " + "AND (:toDate IS NULL OR a.deadline <= :toDate)")
	Page<Assignment> findWithFilters(@Param("teacherId") UUID teacherId, @Param("status") AssignmentStatus status,
			@Param("type") AssignmentType type, @Param("groupId") UUID groupId,
			@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate, Pageable pageable);

	/**
	 * Подсчёт активных заданий учителя
	 */
	long countByTeacherIdAndStatusAndIsDeletedFalse(UUID teacherId, AssignmentStatus status);

	/**
	 * Задания за период (для отчётов)
	 */
	@Query("SELECT a FROM Assignment a WHERE a.teacher.id = :teacherId "
			+ "AND a.createdAt BETWEEN :startDate AND :endDate " + "AND a.isDeleted = false")
	List<Assignment> findByTeacherAndPeriod(@Param("teacherId") UUID teacherId,
			@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

	/**
	 * Шаблоны учителя
	 */
	List<Assignment> findByTeacherIdAndIsTemplateTrueAndIsDeletedFalse(UUID teacherId);

	/**
	 * Публичные шаблоны
	 */
	@Query("SELECT a FROM Assignment a WHERE a.isTemplate = true AND a.isDeleted = false")
	Page<Assignment> findPublicTemplates(Pageable pageable);

	/**
	 * Инкремент просмотров
	 */
	@Modifying
	@Query("UPDATE Assignment a SET a.viewsCount = a.viewsCount + 1 WHERE a.id = :id")
	void incrementViewsCount(@Param("id") UUID id);

	/**
	 * Инкремент начавших
	 */
	@Modifying
	@Query("UPDATE Assignment a SET a.startedCount = a.startedCount + 1 WHERE a.id = :id")
	void incrementStartedCount(@Param("id") UUID id);

	/**
	 * Обновление статистики завершения
	 */
	@Modifying
	@Query("UPDATE Assignment a SET " + "a.completedCount = a.completedCount + 1, "
			+ "a.averageScore = CASE WHEN a.averageScore IS NULL THEN :score "
			+ "  ELSE (a.averageScore * (a.completedCount - 1) + :score) / a.completedCount END, "
/**
 * Задания учителя, созданные после указанной даты
 */
List<Assignment> findByTeacherIdAndCreatedAtAfter(UUID teacherId, LocalDateTime createdAt);

/**
 * Задания группы по статусу
 */
List<Assignment> findByGroupIdInAndStatus(java.util.Set<UUID> groupIds, AssignmentStatus status);

/**
 * Задания группы по ID
 */
List<Assignment> findByGroupIdIn(java.util.Set<UUID> groupIds);
}
