package ru.stopro.dto.student;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import ru.stopro.domain.enums.TaskDifficulty;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DailyChallengeDto {

	private String id;
	private Integer egeNumber;
	private String topic;
	private TaskDifficulty difficulty;
	private String content;
	private Integer rewardXp;
	private String rewardAchievementKey;
	private String rewardAchievementTitle;
	private LocalDate challengeDate;
}
