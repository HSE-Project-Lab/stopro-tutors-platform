package ru.stopro.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.RecommendationType;
import ru.stopro.domain.enums.TopicStatus;
import ru.stopro.dto.student.StudentDashboardDto;
import ru.stopro.repository.AssignmentRepository;
import ru.stopro.repository.AttemptRepository;
import ru.stopro.repository.UserRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentDashboardService {

	private final UserRepository userRepository;
	private final AttemptRepository attemptRepository;
	private final AssignmentRepository assignmentRepository;

	/**
	 * Получить полный дашборд ученика
	 */
	public StudentDashboardDto getDashboard(UUID userId) {
		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

		return StudentDashboardDto.builder().studentName(user.getFullName()).completedTasksTotal(0)
				.solvedProblemsTotal(0).daysStreak(calculateStreak(userId)).targetScore(70).currentScore(0)
				.topicProgress(getTopicProgress(userId)).activeAssignments(getActiveAssignments(userId))
				.recommendations(getRecommendations(userId)).achievements(getAchievements(userId)).build();
	}

	/**
	 * Получить активные задания
	 */
	public List<StudentDashboardDto.AssignmentInfo> getActiveAssignments(UUID userId) {
		// TODO: реальная логика через assignmentRepository
		List<StudentDashboardDto.AssignmentInfo> assignments = new ArrayList<>();
		return assignments;
	}

	/**
	 * Получить прогресс по темам
	 */
	public List<StudentDashboardDto.TopicProgress> getTopicProgress(UUID userId) {
		// TODO: реальная логика через attemptRepository
		List<StudentDashboardDto.TopicProgress> progress = new ArrayList<>();
		return progress;
	}

	/**
	 * Получить активность за неделю
	 */
	public List<StudentDashboardDto.DailyActivity> getWeeklyActivity(UUID userId) {
		List<StudentDashboardDto.DailyActivity> activity = new ArrayList<>();
		LocalDate today = LocalDate.now();

		for (int i = 6; i >= 0; i--) {
			LocalDate date = today.minusDays(i);
			activity.add(StudentDashboardDto.DailyActivity.builder().date(date)
					.dayOfWeek(date.getDayOfWeek().toString().substring(0, 3)).solved(0).correct(0).timeSpentMinutes(0)
					.build());
		}

		return activity;
	}

	/**
	 * Получить рекомендации ИИ
	 */
	public List<StudentDashboardDto.Recommendation> getRecommendations(UUID userId) {
		// TODO: реальная логика через AI-сервис
		return new ArrayList<>();
	}

	/**
	 * Получить достижения
	 */
	public List<StudentDashboardDto.Achievement> getAchievements(UUID userId) {
		// TODO: реальная логика
		return new ArrayList<>();
	}

	/**
	 * Вычислить streak (дни подряд)
	 */
	public int calculateStreak(UUID userId) {
		// TODO: реальная логика через attemptRepository
		return 0;
	}
}
