package ru.stopro.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import ru.stopro.domain.entity.StudentAssignmentSubmission;

@Repository
public interface StudentAssignmentSubmissionRepository extends JpaRepository<StudentAssignmentSubmission, UUID> {

	@EntityGraph(attributePaths = {"answers", "assignment"})
	Optional<StudentAssignmentSubmission> findTopByAssignment_IdAndStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(
			UUID assignmentId, UUID studentId);

	@EntityGraph(attributePaths = {"answers", "assignment"})
	List<StudentAssignmentSubmission> findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(UUID studentId);
}
