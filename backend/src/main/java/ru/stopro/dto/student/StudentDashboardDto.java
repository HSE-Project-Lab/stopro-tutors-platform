package ru.stopro.dto.student;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.enums.RecommendationType;
import ru.stopro.domain.enums.TopicStatus;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StudentDashboardDto {
	private String studentName;
	private Integer currentScore;
	private Integer targetScore;
	private Integer daysStreak;
	private Integer completedTasksTotal;
	private Integer solvedProblemsTotal;
	private Integer correctAnswersTotal;
	private Integer accuracyPercent;
	private Integer averageTimeSeconds;

	private List<AssignmentInfo> activeAssignments;
	private List<TopicProgress> topicProgress;
	private List<Recommendation> recommendations;
	private List<Achievement> achievements;
	private List<ForecastPoint> forecastHistory;
	private Map<String, Integer> weeklyActivity;

	@Data
	@Builder
	@AllArgsConstructor
	@NoArgsConstructor
	public static class AssignmentInfo {
		private String id;
		private String title;
		private LocalDateTime deadline;
		private String subject;
		private Integer tasksCount;
		private Integer timeLimit;
		private boolean isOverdue;
	}

	@Data
	@Builder
	@AllArgsConstructor
	@NoArgsConstructor
	public static class TopicProgress {
		private String topicId;
		private String topicName;
		private Integer egeNumber;
		private Integer successRate;
		private Integer progressPercent;
		private TopicStatus status;
		private Integer solvedCount;
		private Integer totalCount;
	}

	@Data
	@Builder
	@AllArgsConstructor
	@NoArgsConstructor
	public static class Recommendation {
		private String id;
		private String title;
		private String description;
		private RecommendationType type;
		private String priority;
		private String link;
	}

	@Data
	@Builder
	@AllArgsConstructor
	@NoArgsConstructor
	public static class Achievement {
		private String id;
		private String title;
		private String description;
		private String iconUrl;
		private LocalDateTime receivedAt;
		private Integer progressValue;
		private Integer targetValue;
		private Boolean unlocked;
	}

	@Data
	@Builder
	@AllArgsConstructor
	@NoArgsConstructor
	public static class DailyActivity {
		private LocalDate date;
		private String dayOfWeek;
		private Integer solved;
		private Integer correct;
		private Integer timeSpentMinutes;
	}

	@Data
	@Builder
	@AllArgsConstructor
	@NoArgsConstructor
	public static class ForecastPoint {
		private LocalDate date;
		private Integer predictedScore;
	}
}
