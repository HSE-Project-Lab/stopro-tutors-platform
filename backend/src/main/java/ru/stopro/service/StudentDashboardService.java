package ru.stopro.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Assignment;
import ru.stopro.domain.entity.Attempt;
import ru.stopro.domain.entity.EgeTask;
import ru.stopro.domain.entity.StudentAssignmentAnswerResult;
import ru.stopro.domain.entity.StudentAssignmentSubmission;
import ru.stopro.domain.entity.StudentScoreForecast;
import ru.stopro.domain.entity.Topic;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AttemptStatus;
import ru.stopro.domain.enums.RecommendationType;
import ru.stopro.domain.enums.TopicStatus;
import ru.stopro.dto.student.DailyChallengeCompleteRequest;
import ru.stopro.dto.student.DailyChallengeDto;
import ru.stopro.dto.student.StudentDashboardDto;
import ru.stopro.repository.AssignmentRepository;
import ru.stopro.repository.AttemptRepository;
import ru.stopro.repository.EgeTaskRepository;
import ru.stopro.repository.StudentAssignmentSubmissionRepository;
import ru.stopro.repository.StudentScoreForecastRepository;
import ru.stopro.repository.UserRepository;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentDashboardService {

	private final UserRepository userRepository;
	private final AttemptRepository attemptRepository;
	private final AssignmentRepository assignmentRepository;
	private final StudentAssignmentSubmissionRepository submissionRepository;
	private final EgeTaskRepository egeTaskRepository;
	private final AchievementEventProcessorService achievementEventProcessorService;
	private final StudentScoreForecastRepository studentScoreForecastRepository;

	/**
	 * Получить полный дашборд ученика
	 */
	@Transactional
	public StudentDashboardDto getDashboard(UUID userId) {
		User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
		List<Attempt> attempts = getAnalyzableAttempts(userId);
		List<StudentAssignmentSubmission> submissions = submissionRepository
				.findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(userId);
		List<StudentAssignmentAnswerResult> submissionAnswers = submissions.stream()
				.flatMap(s -> s.getAnswers().stream()).collect(Collectors.toList());

		int solvedProblemsTotal = attempts.size() + submissionAnswers.size();
		int correctAnswersTotal = (int) attempts.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count()
				+ (int) submissionAnswers.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
		int accuracyPercent = solvedProblemsTotal > 0
				? (int) Math.round(correctAnswersTotal * 100.0 / solvedProblemsTotal)
				: 0;
		int averageTimeSeconds = (int) Math
				.round(attempts.stream().map(Attempt::getTimeSpentSeconds).filter(Objects::nonNull)
						.filter(seconds -> seconds > 0).mapToInt(Integer::intValue).average().orElse(0));
		int completedTasksTotal = (int) java.util.stream.Stream
				.concat(attempts.stream().map(Attempt::getAssignment).filter(Objects::nonNull),
						submissions.stream().map(StudentAssignmentSubmission::getAssignment).filter(Objects::nonNull))
				.map(Assignment::getId).distinct().count();

		List<StudentDashboardDto.TopicProgress> topicProgress = buildTopicProgress(attempts, submissionAnswers);
		int predictedScore = calculatePredictedScore(topicProgress);
		saveForecastSnapshot(user, predictedScore);
		List<StudentDashboardDto.ForecastPoint> forecastHistory = getForecastHistory(userId);

		List<StudentDashboardDto.DailyActivity> weeklyActivityDetails = getActivity(userId, 7);
		Map<String, Integer> weeklyActivity = new LinkedHashMap<>();
		for (StudentDashboardDto.DailyActivity daily : weeklyActivityDetails) {
			weeklyActivity.put(daily.getDayOfWeek(), daily.getSolved());
		}

		return StudentDashboardDto.builder().studentName(user.getFullName()).completedTasksTotal(completedTasksTotal)
				.solvedProblemsTotal(solvedProblemsTotal).correctAnswersTotal(correctAnswersTotal)
				.accuracyPercent(accuracyPercent).averageTimeSeconds(averageTimeSeconds)
				.daysStreak(calculateStreak(userId)).targetScore(70).currentScore(predictedScore)
				.topicProgress(topicProgress).activeAssignments(getActiveAssignments(userId))
				.recommendations(getRecommendations(userId)).achievements(getAchievements(userId))
				.forecastHistory(forecastHistory).weeklyActivity(weeklyActivity).build();
	}

	/**
	 * Получить активные задания
	 */
	public List<StudentDashboardDto.AssignmentInfo> getActiveAssignments(UUID userId) {
		return assignmentRepository.findActiveForStudent(userId).stream()
				.map(assignment -> StudentDashboardDto.AssignmentInfo.builder().id(assignment.getId().toString())
						.title(assignment.getTitle()).deadline(assignment.getDeadline())
						.subject("Профильная математика").tasksCount(assignment.getQuestionsCount())
						.timeLimit(assignment.getTimeLimitMinutes()).isOverdue(assignment.isOverdue()).build())
				.collect(Collectors.toList());
	}

	/**
	 * Получить прогресс по темам
	 */
	public List<StudentDashboardDto.TopicProgress> getTopicProgress(UUID userId) {
		List<Attempt> attempts = getAnalyzableAttempts(userId);
		List<StudentAssignmentAnswerResult> submissionAnswers = submissionRepository
				.findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(userId).stream()
				.flatMap(s -> s.getAnswers().stream()).collect(Collectors.toList());
		return buildTopicProgress(attempts, submissionAnswers);
	}

	/**
	 * Получить активность за неделю
	 */
	public List<StudentDashboardDto.DailyActivity> getWeeklyActivity(UUID userId) {
		return getActivity(userId, 7);
	}

	/**
	 * Получить активность за N дней
	 */
	public List<StudentDashboardDto.DailyActivity> getActivity(UUID userId, int days) {
		int normalizedDays = Math.max(1, Math.min(days, 365));
		List<Attempt> attempts = getAnalyzableAttempts(userId);
		List<StudentAssignmentSubmission> submissions = submissionRepository
				.findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(userId);
		LocalDate startDate = LocalDate.now().minusDays(normalizedDays - 1L);

		Map<LocalDate, DailyAccumulator> dailyStats = new HashMap<>();
		for (Attempt attempt : attempts) {
			LocalDateTime activityTime = resolveActivityTime(attempt);
			if (activityTime == null) {
				continue;
			}

			LocalDate date = activityTime.toLocalDate();
			if (date.isBefore(startDate)) {
				continue;
			}

			DailyAccumulator acc = dailyStats.computeIfAbsent(date, key -> new DailyAccumulator());
			acc.solved++;
			if (Boolean.TRUE.equals(attempt.getIsCorrect())) {
				acc.correct++;
			}
			if (attempt.getTimeSpentSeconds() != null && attempt.getTimeSpentSeconds() > 0) {
				acc.totalTimeSeconds += attempt.getTimeSpentSeconds();
			}
		}

		for (StudentAssignmentSubmission submission : submissions) {
			if (submission.getSubmittedAt() == null) {
				continue;
			}

			LocalDate date = submission.getSubmittedAt().toLocalDate();
			if (date.isBefore(startDate)) {
				continue;
			}

			DailyAccumulator acc = dailyStats.computeIfAbsent(date, key -> new DailyAccumulator());
			acc.solved += submission.getTotalQuestions() != null ? submission.getTotalQuestions() : 0;
			acc.correct += submission.getCorrectAnswers() != null ? submission.getCorrectAnswers() : 0;
		}

		List<StudentDashboardDto.DailyActivity> activity = new ArrayList<>();
		for (int i = normalizedDays - 1; i >= 0; i--) {
			LocalDate date = LocalDate.now().minusDays(i);
			DailyAccumulator acc = dailyStats.getOrDefault(date, new DailyAccumulator());
			activity.add(StudentDashboardDto.DailyActivity.builder().date(date)
					.dayOfWeek(date.getDayOfWeek().getDisplayName(TextStyle.SHORT, new Locale("ru", "RU")))
					.solved(acc.solved).correct(acc.correct)
					.timeSpentMinutes((int) Math.round(acc.totalTimeSeconds / 60.0)).build());
		}

		return activity;
	}

	/**
	 * Получить рекомендации ИИ
	 */
	public List<StudentDashboardDto.Recommendation> getRecommendations(UUID userId) {
		List<StudentDashboardDto.TopicProgress> topics = getTopicProgress(userId);
		List<StudentDashboardDto.Recommendation> recommendations = new ArrayList<>();

		topics.stream().filter(topic -> topic.getStatus() == TopicStatus.WEAK).limit(2)
				.forEach(topic -> recommendations.add(StudentDashboardDto.Recommendation.builder()
						.id(UUID.randomUUID().toString()).title("Усиль тему: " + topic.getTopicName())
						.description("Рекомендуем дополнительно решить 5-7 задач по теме №"
								+ (topic.getEgeNumber() != null ? topic.getEgeNumber() : "?") + " для роста точности.")
						.type(RecommendationType.WEAK_TOPIC).priority("HIGH").link("/practice").build()));

		topics.stream().filter(topic -> topic.getStatus() == TopicStatus.STRONG).findFirst()
				.ifPresent(topic -> recommendations.add(StudentDashboardDto.Recommendation.builder()
						.id(UUID.randomUUID().toString()).title("Поддерживай сильную тему: " + topic.getTopicName())
						.description("Отличный результат. Повтори тему через 2-3 дня для закрепления.")
						.type(RecommendationType.STRONG_TOPIC).priority("LOW").link("/practice").build()));

		if (recommendations.isEmpty()) {
			recommendations.add(StudentDashboardDto.Recommendation.builder().id(UUID.randomUUID().toString())
					.title("Продолжай регулярную практику")
					.description("Решай минимум 5 задач в день, чтобы стабильно наращивать результат.")
					.type(RecommendationType.PRACTICE).priority("MEDIUM").link("/practice").build());
		}

		return recommendations;
	}

	/**
	 * Получить достижения
	 */
	@Transactional
	public List<StudentDashboardDto.Achievement> getAchievements(UUID userId) {
		List<Attempt> attempts = getAnalyzableAttempts(userId);
		List<StudentAssignmentSubmission> submissions = submissionRepository
				.findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(userId);
		syncDerivedAchievements(userId, attempts, submissions);
		return achievementEventProcessorService.getAchievementStates(userId);
	}

	private void syncDerivedAchievements(UUID userId, List<Attempt> attempts,
			List<StudentAssignmentSubmission> submissions) {
		int streak = calculateStreak(userId);
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "IRON_STREAK_7", Math.min(streak, 7),
				LocalDateTime.now());
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "IRON_STREAK_30",
				Math.min(streak, 30), LocalDateTime.now());
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "IRON_STREAK_100",
				Math.min(streak, 100), LocalDateTime.now());

		int deadlineStorm = submissions.stream()
				.filter(submission -> submission.getAssignment() != null && submission.getSubmittedAt() != null)
				.filter(submission -> submission.getAssignment().getCreatedAt() != null)
				.anyMatch(submission -> java.time.Duration
						.between(submission.getAssignment().getCreatedAt(), submission.getSubmittedAt()).toHours() <= 2)
								? 1
								: 0;
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "DEADLINE_STORM", deadlineStorm,
				LocalDateTime.now());

		int nightWatchCount = (int) attempts.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect()))
				.map(this::resolveActivityTime).filter(Objects::nonNull).filter(time -> time.getHour() < 5).count();
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "NIGHT_WATCH", nightWatchCount,
				LocalDateTime.now());

		int part1Streak = 0;
		int part1Best = 0;
		List<Attempt> chronological = attempts.stream().sorted(
				Comparator.comparing(this::resolveActivityTime, Comparator.nullsLast(Comparator.naturalOrder())))
				.toList();
		for (Attempt attempt : chronological) {
			Integer egeNumber = attempt.getQuestion() != null ? attempt.getQuestion().getEgeNumber() : null;
			if (egeNumber == null || egeNumber < 1 || egeNumber > 12) {
				continue;
			}
			if (Boolean.TRUE.equals(attempt.getIsCorrect())) {
				part1Streak++;
				part1Best = Math.max(part1Best, part1Streak);
			} else {
				part1Streak = 0;
			}
		}
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "PART1_LORD", part1Best,
				LocalDateTime.now());

		int paramStreak = 0;
		int paramBest = 0;
		for (Attempt attempt : chronological) {
			Integer egeNumber = attempt.getQuestion() != null ? attempt.getQuestion().getEgeNumber() : null;
			if (egeNumber == null || egeNumber != 18) {
				continue;
			}
			boolean maxScored = attempt.getPointsEarned() != null && attempt.getMaxPoints() != null
					&& attempt.getMaxPoints() > 0 && attempt.getPointsEarned() >= attempt.getMaxPoints();
			if (maxScored) {
				paramStreak++;
				paramBest = Math.max(paramBest, paramStreak);
			} else {
				paramStreak = 0;
			}
		}
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "PARAM_HUNTER", paramBest,
				LocalDateTime.now());

		int sniperProgress = hasPerfectWeek(attempts, submissions) ? 1 : 0;
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "SNIPER_WEEK", sniperProgress,
				LocalDateTime.now());

		int comebackProgress = hasBeautifulComeback(chronological) ? 1 : 0;
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "BEAUTIFUL_COMEBACK",
				comebackProgress, LocalDateTime.now());

		int speedrunProgress = submissions.stream()
				.anyMatch(submission -> submission.getScorePercent() != null && submission.getScorePercent() >= 100
						&& submission.getTotalQuestions() != null && submission.getTotalQuestions() >= 12
						&& submission.getAssignment() != null
						&& submission.getAssignment().getTimeLimitMinutes() != null
						&& submission.getAssignment().getTimeLimitMinutes() <= 30) ? 1 : 0;
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "EGE_SPEEDRUN", speedrunProgress,
				LocalDateTime.now());

		int firstBloodProgress = submissions.stream()
				.anyMatch(submission -> submission.getScorePercent() != null && submission.getScorePercent() >= 100
						&& submission.getAssignment() != null && submission.getAssignment().getTitle() != null
						&& submission.getAssignment().getTitle().toLowerCase().matches(".*(ai|ии).*")) ? 1 : 0;
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "FIRST_BLOOD", firstBloodProgress,
				LocalDateTime.now());

		List<StudentScoreForecast> forecastHistory = studentScoreForecastRepository
				.findByStudent_IdAndIsDeletedFalseOrderByForecastDateAsc(userId);
		int forecastShift = calculateMonthlyForecastShift(forecastHistory);
		achievementEventProcessorService.upsertDerivedAchievementProgress(userId, "FORECAST_SHIFT_10", forecastShift,
				LocalDateTime.now());
	}

	@Transactional
	public boolean recordDailyChallengeCompleted(UUID userId, DailyChallengeCompleteRequest request) {
		String challengeTaskId = request != null ? request.getChallengeTaskId() : null;
		Integer egeNumber = request != null ? request.getEgeNumber() : null;
		return achievementEventProcessorService.recordDailyChallengeCompleted(userId, challengeTaskId, egeNumber,
				LocalDateTime.now());
	}

	/**
	 * Детеминированная задача дня
	 */
	public DailyChallengeDto getDailyChallenge(UUID userId) {
		LocalDate today = LocalDate.now();
		List<StudentDashboardDto.TopicProgress> topicProgress = getTopicProgress(userId);

		Integer weakEgeNumber = topicProgress.stream().filter(topic -> topic.getEgeNumber() != null)
				.sorted(Comparator.comparing(StudentDashboardDto.TopicProgress::getSuccessRate)
						.thenComparing(StudentDashboardDto.TopicProgress::getTotalCount, Comparator.reverseOrder()))
				.map(StudentDashboardDto.TopicProgress::getEgeNumber).findFirst().orElse(null);

		int seed = Math.abs((userId.toString() + ":" + today).hashCode());
		int fallbackEgeNumber = (seed % 19) + 1;
		int preferredEgeNumber = weakEgeNumber != null ? weakEgeNumber : fallbackEgeNumber;

		List<EgeTask> candidates = egeTaskRepository
				.findByParentIsNullAndEgeNumberOrderByCreatedAtAsc(preferredEgeNumber);
		if (candidates.isEmpty()) {
			List<EgeTask> allTasks = egeTaskRepository.findByParentIsNullOrderByEgeNumberAscCreatedAtAsc();
			if (allTasks.isEmpty()) {
				throw new RuntimeException("No EGE tasks available for daily challenge");
			}
			EgeTask fallback = allTasks.get(seed % allTasks.size());
			return toDailyChallengeDto(fallback, today);
		}

		EgeTask selectedTask = candidates.get(seed % candidates.size());
		return toDailyChallengeDto(selectedTask, today);
	}

	/**
	 * Вычислить streak (дни подряд)
	 */
	public int calculateStreak(UUID userId) {
		Set<LocalDate> activeDays = getActiveDays(userId);

		int streak = 0;
		LocalDate cursor = LocalDate.now();
		while (activeDays.contains(cursor)) {
			streak++;
			cursor = cursor.minusDays(1);
		}

		return streak;
	}

	private Set<LocalDate> getActiveDays(UUID userId) {
		List<Attempt> attempts = getAnalyzableAttempts(userId);
		List<StudentAssignmentSubmission> submissions = submissionRepository
				.findByStudent_IdAndIsDeletedFalseOrderBySubmittedAtDesc(userId);
		Set<LocalDate> activeDays = new HashSet<>();

		for (Attempt attempt : attempts) {
			LocalDateTime activityTime = resolveActivityTime(attempt);
			if (activityTime != null) {
				activeDays.add(activityTime.toLocalDate());
			}
		}

		for (StudentAssignmentSubmission submission : submissions) {
			if (submission.getSubmittedAt() != null) {
				activeDays.add(submission.getSubmittedAt().toLocalDate());
			}
		}

		return activeDays;
	}

	private int countHighQualityDays(UUID userId, int minSolved, int minAccuracyPercent) {
		List<StudentDashboardDto.DailyActivity> activity = getActivity(userId, 60);
		return (int) activity.stream().filter(day -> {
			int solved = day.getSolved() != null ? day.getSolved() : 0;
			int correct = day.getCorrect() != null ? day.getCorrect() : 0;
			int accuracy = solved > 0 ? (int) Math.round(correct * 100.0 / solved) : 0;
			return solved >= minSolved && accuracy >= minAccuracyPercent;
		}).count();
	}

	private java.util.Optional<LocalDateTime> resolveNthSolvedAt(List<Attempt> attempts,
			List<StudentAssignmentSubmission> submissions, int solvedTarget) {
		List<LocalDateTime> solvedMoments = new ArrayList<>();

		for (Attempt attempt : attempts) {
			LocalDateTime moment = resolveActivityTime(attempt);
			if (moment != null) {
				solvedMoments.add(moment);
			}
		}

		for (StudentAssignmentSubmission submission : submissions) {
			if (submission.getSubmittedAt() == null) {
				continue;
			}
			int count = submission.getTotalQuestions() != null ? submission.getTotalQuestions() : 0;
			for (int i = 0; i < count; i++) {
				solvedMoments.add(submission.getSubmittedAt());
			}
		}

		solvedMoments.sort(Comparator.naturalOrder());
		if (solvedMoments.size() < solvedTarget) {
			return java.util.Optional.empty();
		}

		return java.util.Optional.of(solvedMoments.get(solvedTarget - 1));
	}

	private java.util.Optional<LocalDateTime> resolveStreakReachedAt(UUID userId, int streakTarget) {
		Set<LocalDate> activeDays = getActiveDays(userId);
		if (activeDays.isEmpty()) {
			return java.util.Optional.empty();
		}

		List<LocalDate> sortedDays = activeDays.stream().sorted().toList();
		int streak = 0;
		LocalDate prev = null;
		for (LocalDate day : sortedDays) {
			if (prev == null || day.equals(prev.plusDays(1))) {
				streak++;
			} else {
				streak = 1;
			}

			if (streak >= streakTarget) {
				return java.util.Optional.of(day.atTime(12, 0));
			}
			prev = day;
		}

		return java.util.Optional.empty();
	}

	private DailyChallengeDto toDailyChallengeDto(EgeTask task, LocalDate challengeDate) {
		return DailyChallengeDto.builder().id(task.getId()).egeNumber(task.getEgeNumber()).topic(task.getTopic())
				.difficulty(task.getDifficulty()).content(task.getContent()).rewardXp(50)
				.rewardAchievementKey("daily-challenge").rewardAchievementTitle("Задача дня")
				.challengeDate(challengeDate).build();
	}

	private int calculatePredictedScore(List<StudentDashboardDto.TopicProgress> topicProgress) {
		final int[] scale = {0, 5, 11, 17, 22, 27, 34, 40, 46, 52, 58, 64, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90,
				92, 94, 96, 98, 100, 100, 100, 100, 100, 100};
		Map<Integer, Integer> maxPoints = Map.ofEntries(Map.entry(1, 1), Map.entry(2, 1), Map.entry(3, 1),
				Map.entry(4, 1), Map.entry(5, 1), Map.entry(6, 1), Map.entry(7, 1), Map.entry(8, 1), Map.entry(9, 1),
				Map.entry(10, 1), Map.entry(11, 1), Map.entry(12, 1), Map.entry(13, 2), Map.entry(14, 3),
				Map.entry(15, 2), Map.entry(16, 2), Map.entry(17, 3), Map.entry(18, 4), Map.entry(19, 4));

		double expectedPrimary = 0;
		for (int taskNumber = 1; taskNumber <= 19; taskNumber++) {
			final int currentTaskNumber = taskNumber;
			List<StudentDashboardDto.TopicProgress> perTask = topicProgress.stream()
					.filter(topic -> topic.getEgeNumber() != null && topic.getEgeNumber() == currentTaskNumber)
					.toList();
			if (perTask.isEmpty()) {
				continue;
			}

			double avgSuccess = perTask.stream()
					.mapToInt(topic -> topic.getSuccessRate() != null ? topic.getSuccessRate() : 0).average().orElse(0)
					/ 100.0;
			int attempts = perTask.stream().mapToInt(topic -> topic.getTotalCount() != null ? topic.getTotalCount() : 0)
					.sum();
			if (attempts < 5) {
				double confidence = attempts / 5.0;
				avgSuccess = (avgSuccess * confidence) + (0.2 * (1.0 - confidence));
			}
			expectedPrimary += avgSuccess * maxPoints.getOrDefault(currentTaskNumber, 0);
		}

		int roundedPrimary = (int) Math.round(expectedPrimary);
		int safeIndex = Math.max(0, Math.min(roundedPrimary, scale.length - 1));
		return scale[safeIndex];
	}

	private void saveForecastSnapshot(User user, int predictedScore) {
		LocalDate today = LocalDate.now();
		StudentScoreForecast snapshot = studentScoreForecastRepository
				.findByStudent_IdAndForecastDate(user.getId(), today).orElseGet(() -> StudentScoreForecast.builder()
						.student(user).forecastDate(today).source("DASHBOARD").predictedScore(predictedScore).build());
		snapshot.setPredictedScore(predictedScore);
		studentScoreForecastRepository.save(snapshot);
	}

	private List<StudentDashboardDto.ForecastPoint> getForecastHistory(UUID userId) {
		return studentScoreForecastRepository.findByStudent_IdAndIsDeletedFalseOrderByForecastDateAsc(userId).stream()
				.map(point -> StudentDashboardDto.ForecastPoint.builder().date(point.getForecastDate())
						.predictedScore(point.getPredictedScore()).build())
				.collect(Collectors.toList());
	}

	private int calculateMonthlyForecastShift(List<StudentScoreForecast> history) {
		if (history.isEmpty()) {
			return 0;
		}

		LocalDate thresholdDate = LocalDate.now().minusDays(30);
		List<StudentScoreForecast> window = history.stream()
				.filter(item -> !item.getForecastDate().isBefore(thresholdDate)).toList();
		if (window.size() < 2) {
			return 0;
		}

		int minScore = window.stream().mapToInt(item -> item.getPredictedScore() != null ? item.getPredictedScore() : 0)
				.min().orElse(0);
		int maxScore = window.stream().mapToInt(item -> item.getPredictedScore() != null ? item.getPredictedScore() : 0)
				.max().orElse(0);
		return Math.max(0, maxScore - minScore);
	}

	private boolean hasPerfectWeek(List<Attempt> attempts, List<StudentAssignmentSubmission> submissions) {
		LocalDate threshold = LocalDate.now().minusDays(7);
		int solved = 0;
		int correct = 0;

		for (Attempt attempt : attempts) {
			LocalDateTime at = resolveActivityTime(attempt);
			if (at == null || at.toLocalDate().isBefore(threshold)) {
				continue;
			}
			solved++;
			if (Boolean.TRUE.equals(attempt.getIsCorrect())) {
				correct++;
			}
		}

		for (StudentAssignmentSubmission submission : submissions) {
			if (submission.getSubmittedAt() == null || submission.getSubmittedAt().toLocalDate().isBefore(threshold)) {
				continue;
			}
			solved += submission.getTotalQuestions() != null ? submission.getTotalQuestions() : 0;
			correct += submission.getCorrectAnswers() != null ? submission.getCorrectAnswers() : 0;
		}

		return solved >= 20 && solved == correct;
	}

	private boolean hasBeautifulComeback(List<Attempt> chronological) {
		Map<String, Integer> wrongStreakByTopic = new HashMap<>();
		for (Attempt attempt : chronological) {
			String topic = attempt.getQuestion() != null && attempt.getQuestion().getTopic() != null
					? attempt.getQuestion().getTopic().getName()
					: null;
			if (topic == null) {
				continue;
			}

			int wrongStreak = wrongStreakByTopic.getOrDefault(topic, 0);
			if (Boolean.TRUE.equals(attempt.getIsCorrect())) {
				if (wrongStreak >= 3) {
					return true;
				}
				wrongStreakByTopic.put(topic, 0);
			} else {
				wrongStreakByTopic.put(topic, wrongStreak + 1);
			}
		}
		return false;
	}

	private List<Attempt> getAnalyzableAttempts(UUID userId) {
		return attemptRepository.findByStudent_IdAndIsDeletedFalse(userId).stream().filter(this::isIncludedInAnalytics)
				.collect(Collectors.toList());
	}

	private boolean isIncludedInAnalytics(Attempt attempt) {
		AttemptStatus status = attempt.getStatus();
		boolean finalStatus = status == AttemptStatus.CHECKED || status == AttemptStatus.COMPLETED;
		boolean hasCheckResult = attempt.getIsCorrect() != null;
		boolean checkedByTeacher = Boolean.TRUE.equals(attempt.getIsManuallyChecked())
				|| attempt.getCheckedAt() != null;

		if (checkedByTeacher) {
			return finalStatus || attempt.getCheckedAt() != null;
		}

		return finalStatus || hasCheckResult;
	}

	private LocalDateTime resolveActivityTime(Attempt attempt) {
		if (attempt.getCheckedAt() != null) {
			return attempt.getCheckedAt();
		}
		if (attempt.getAnsweredAt() != null) {
			return attempt.getAnsweredAt();
		}
		if (attempt.getFinishedAt() != null) {
			return attempt.getFinishedAt();
		}
		return attempt.getStartedAt();
	}

	private List<StudentDashboardDto.TopicProgress> buildTopicProgress(List<Attempt> attempts,
			List<StudentAssignmentAnswerResult> submissionAnswers) {
		Map<UUID, TopicAccumulator> byTopic = new HashMap<>();
		Map<String, TopicAccumulator> byTopicName = new HashMap<>();

		for (Attempt attempt : attempts) {
			if (attempt.getQuestion() == null || attempt.getQuestion().getTopic() == null) {
				continue;
			}

			Topic topic = attempt.getQuestion().getTopic();
			TopicAccumulator acc = byTopic.computeIfAbsent(topic.getId(), key -> new TopicAccumulator(topic));
			acc.total++;
			if (Boolean.TRUE.equals(attempt.getIsCorrect())) {
				acc.correct++;
			}
			Integer egeNumber = attempt.getQuestion().getEgeNumber();
			if (egeNumber != null && (acc.egeNumber == null || egeNumber < acc.egeNumber)) {
				acc.egeNumber = egeNumber;
			}
		}

		for (StudentAssignmentAnswerResult answer : submissionAnswers) {
			String topicName = answer.getTopicName() != null && !answer.getTopicName().isBlank()
					? answer.getTopicName()
					: "Тема";
			TopicAccumulator acc = byTopicName.computeIfAbsent(topicName,
					key -> new TopicAccumulator(topicName, answer.getEgeNumber()));
			acc.total++;
			if (Boolean.TRUE.equals(answer.getIsCorrect())) {
				acc.correct++;
			}
			if (answer.getEgeNumber() != null && (acc.egeNumber == null || answer.getEgeNumber() < acc.egeNumber)) {
				acc.egeNumber = answer.getEgeNumber();
			}
		}

		List<StudentDashboardDto.TopicProgress> fromAttempts = byTopic.values().stream().map(this::toTopicProgress)
				.sorted(Comparator.comparing(StudentDashboardDto.TopicProgress::getSuccessRate)
						.thenComparing(StudentDashboardDto.TopicProgress::getTotalCount, Comparator.reverseOrder())
						.thenComparing(StudentDashboardDto.TopicProgress::getTopicName))
				.collect(Collectors.toList());

		List<StudentDashboardDto.TopicProgress> fromSubmissions = byTopicName.values().stream()
				.map(this::toTopicProgress)
				.sorted(Comparator.comparing(StudentDashboardDto.TopicProgress::getSuccessRate)
						.thenComparing(StudentDashboardDto.TopicProgress::getTotalCount, Comparator.reverseOrder())
						.thenComparing(StudentDashboardDto.TopicProgress::getTopicName))
				.collect(Collectors.toList());

		Map<String, StudentDashboardDto.TopicProgress> merged = new LinkedHashMap<>();
		for (StudentDashboardDto.TopicProgress progress : fromAttempts) {
			merged.put(progress.getTopicName() + "::" + progress.getEgeNumber(), progress);
		}
		for (StudentDashboardDto.TopicProgress progress : fromSubmissions) {
			String key = progress.getTopicName() + "::" + progress.getEgeNumber();
			StudentDashboardDto.TopicProgress existing = merged.get(key);
			if (existing == null) {
				merged.put(key, progress);
				continue;
			}

			int total = (existing.getTotalCount() != null ? existing.getTotalCount() : 0)
					+ (progress.getTotalCount() != null ? progress.getTotalCount() : 0);
			int correct = (existing.getSolvedCount() != null ? existing.getSolvedCount() : 0)
					+ (progress.getSolvedCount() != null ? progress.getSolvedCount() : 0);
			int success = total > 0 ? (int) Math.round(correct * 100.0 / total) : 0;

			merged.put(key, StudentDashboardDto.TopicProgress.builder().topicId(existing.getTopicId())
					.topicName(existing.getTopicName())
					.egeNumber(existing.getEgeNumber() != null ? existing.getEgeNumber() : progress.getEgeNumber())
					.successRate(success).progressPercent(success).status(resolveTopicStatus(success))
					.solvedCount(correct).totalCount(total).build());
		}

		return merged.values().stream()
				.sorted(Comparator.comparing(StudentDashboardDto.TopicProgress::getSuccessRate)
						.thenComparing(StudentDashboardDto.TopicProgress::getTotalCount, Comparator.reverseOrder())
						.thenComparing(StudentDashboardDto.TopicProgress::getTopicName))
				.collect(Collectors.toList());
	}

	private StudentDashboardDto.TopicProgress toTopicProgress(TopicAccumulator acc) {
		int successRate = acc.total > 0 ? (int) Math.round(acc.correct * 100.0 / acc.total) : 0;

		return StudentDashboardDto.TopicProgress.builder().topicId(acc.topicId).topicName(acc.topicName)
				.egeNumber(acc.egeNumber).successRate(successRate).progressPercent(successRate)
				.status(resolveTopicStatus(successRate)).solvedCount(acc.correct).totalCount(acc.total).build();
	}

	private TopicStatus resolveTopicStatus(int successRate) {
		if (successRate < 60) {
			return TopicStatus.WEAK;
		}
		if (successRate < 80) {
			return TopicStatus.NORMAL;
		}
		return TopicStatus.STRONG;
	}

	private static class TopicAccumulator {
		private final String topicId;
		private final String topicName;
		private int total;
		private int correct;
		private Integer egeNumber;

		private TopicAccumulator(Topic topic) {
			this.topicId = topic.getId().toString();
			this.topicName = topic.getName();
		}

		private TopicAccumulator(String topicName, Integer egeNumber) {
			this.topicId = "submission:" + topicName + ":" + (egeNumber != null ? egeNumber : "na");
			this.topicName = topicName;
			this.egeNumber = egeNumber;
		}
	}

	private static class DailyAccumulator {
		private int solved;
		private int correct;
		private int totalTimeSeconds;
	}
}
