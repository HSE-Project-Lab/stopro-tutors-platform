package ru.stopro.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.AchievementDefinition;
import ru.stopro.domain.entity.StudentAchievement;
import ru.stopro.domain.entity.StudentAchievementEvent;
import ru.stopro.domain.entity.StudentAchievementProgress;
import ru.stopro.domain.entity.User;
import ru.stopro.domain.enums.AchievementEventType;
import ru.stopro.dto.student.StudentDashboardDto;
import ru.stopro.repository.AchievementDefinitionRepository;
import ru.stopro.repository.StudentAchievementEventRepository;
import ru.stopro.repository.StudentAchievementProgressRepository;
import ru.stopro.repository.StudentAchievementRepository;
import ru.stopro.repository.UserRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class AchievementEventProcessorService {

	private static final String DAILY_CHALLENGE_ACHIEVEMENT_KEY = "DAILY_CHALLENGE_5";

	private final UserRepository userRepository;
	private final AchievementDefinitionRepository achievementDefinitionRepository;
	private final StudentAchievementEventRepository achievementEventRepository;
	private final StudentAchievementProgressRepository achievementProgressRepository;
	private final StudentAchievementRepository studentAchievementRepository;

	@Transactional
	public boolean recordDailyChallengeCompleted(UUID studentId, String challengeTaskId, Integer egeNumber,
			LocalDateTime eventAt) {
		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("User not found"));
		LocalDateTime effectiveEventAt = eventAt != null ? eventAt : LocalDateTime.now();
		LocalDate eventDate = effectiveEventAt.toLocalDate();

		boolean duplicate = achievementEventRepository.existsByStudent_IdAndEventTypeAndEventDate(studentId,
				AchievementEventType.DAILY_CHALLENGE_COMPLETED, eventDate);
		if (duplicate) {
			return false;
		}

		String payload = "{\"challengeTaskId\":\"" + (challengeTaskId != null ? challengeTaskId : "")
				+ "\",\"egeNumber\":" + (egeNumber != null ? egeNumber : "null") + "}";

		StudentAchievementEvent event = StudentAchievementEvent.builder().student(student)
				.eventType(AchievementEventType.DAILY_CHALLENGE_COMPLETED).eventDate(eventDate)
				.eventAt(effectiveEventAt).referenceId(challengeTaskId).payload(payload).build();
		achievementEventRepository.save(event);

		incrementCounterAchievement(student, DAILY_CHALLENGE_ACHIEVEMENT_KEY, effectiveEventAt);
		return true;
	}

	@Transactional(readOnly = true)
	public List<StudentDashboardDto.Achievement> getAchievementStates(UUID studentId) {
		List<AchievementDefinition> definitions = achievementDefinitionRepository
				.findByIsActiveTrueOrderBySortOrderAscKeyAsc();
		Map<String, StudentAchievementProgress> progressByKey = achievementProgressRepository
				.findByStudent_IdAndIsDeletedFalse(studentId).stream()
				.collect(Collectors.toMap(progress -> progress.getAchievement().getKey(), progress -> progress,
						(existing, replacement) -> existing, HashMap::new));
		Map<String, StudentAchievement> unlockedByKey = studentAchievementRepository
				.findByStudent_IdAndIsDeletedFalse(studentId).stream()
				.collect(Collectors.toMap(unlocked -> unlocked.getAchievement().getKey(), unlocked -> unlocked,
						(existing, replacement) -> existing, HashMap::new));

		List<StudentDashboardDto.Achievement> result = new ArrayList<>();
		for (AchievementDefinition definition : definitions) {
			StudentAchievementProgress progress = progressByKey.get(definition.getKey());
			StudentAchievement unlocked = unlockedByKey.get(definition.getKey());

			int currentValue = progress != null && progress.getCurrentValue() != null ? progress.getCurrentValue() : 0;
			int targetValue = definition.getTargetValue() != null ? definition.getTargetValue() : 1;
			boolean isUnlocked = unlocked != null
					|| (progress != null && Boolean.TRUE.equals(progress.getIsCompleted()));
			LocalDateTime unlockedAt = unlocked != null
					? unlocked.getUnlockedAt()
					: (progress != null ? progress.getUnlockedAt() : null);

			result.add(StudentDashboardDto.Achievement.builder().id(definition.getKey()).title(definition.getTitle())
					.description(definition.getDescription()).iconUrl(definition.getIconUrl()).receivedAt(unlockedAt)
					.progressValue(currentValue).targetValue(targetValue).unlocked(isUnlocked).build());
		}

		result.sort(Comparator
				.comparing(StudentDashboardDto.Achievement::getUnlocked,
						Comparator.nullsLast(Comparator.reverseOrder()))
				.thenComparing(StudentDashboardDto.Achievement::getTitle));
		return result;
	}

	@Transactional
	protected void incrementCounterAchievement(User student, String achievementKey, LocalDateTime eventAt) {
		AchievementDefinition definition = achievementDefinitionRepository.findByKeyAndIsActiveTrue(achievementKey)
				.orElseThrow(() -> new RuntimeException("Achievement definition not found: " + achievementKey));

		StudentAchievementProgress progress = achievementProgressRepository
				.findByStudent_IdAndAchievement_Key(student.getId(), achievementKey)
				.orElseGet(() -> StudentAchievementProgress.builder().student(student).achievement(definition)
						.currentValue(0).targetValue(definition.getTargetValue()).isCompleted(false).build());

		if (Boolean.TRUE.equals(progress.getIsCompleted())) {
			progress.setLastEventAt(eventAt);
			achievementProgressRepository.save(progress);
			return;
		}

		int nextValue = (progress.getCurrentValue() != null ? progress.getCurrentValue() : 0) + 1;
		progress.setCurrentValue(nextValue);
		progress.setTargetValue(definition.getTargetValue());
		progress.setLastEventAt(eventAt);

		int target = definition.getTargetValue() != null ? definition.getTargetValue() : 1;
		if (nextValue >= target) {
			progress.setIsCompleted(true);
			progress.setUnlockedAt(eventAt);

			if (!studentAchievementRepository.existsByStudent_IdAndAchievement_Key(student.getId(), achievementKey)) {
				studentAchievementRepository.save(StudentAchievement.builder().student(student).achievement(definition)
						.unlockedAt(eventAt).build());
			}
		}

		achievementProgressRepository.save(progress);
	}

	@Transactional
	public void upsertDerivedAchievementProgress(UUID studentId, String achievementKey, int currentValue,
			LocalDateTime measuredAt) {
		User student = userRepository.findById(studentId).orElseThrow(() -> new RuntimeException("User not found"));
		AchievementDefinition definition = achievementDefinitionRepository.findByKeyAndIsActiveTrue(achievementKey)
				.orElseThrow(() -> new RuntimeException("Achievement definition not found: " + achievementKey));

		int sanitizedCurrent = Math.max(0, currentValue);
		int target = definition.getTargetValue() != null ? definition.getTargetValue() : 1;
		boolean shouldBeCompleted = sanitizedCurrent >= target;
		LocalDateTime effectiveMeasuredAt = measuredAt != null ? measuredAt : LocalDateTime.now();

		StudentAchievementProgress progress = achievementProgressRepository
				.findByStudent_IdAndAchievement_Key(studentId, achievementKey)
				.orElseGet(() -> StudentAchievementProgress.builder().student(student).achievement(definition)
						.currentValue(0).targetValue(target).isCompleted(false).build());

		progress.setCurrentValue(sanitizedCurrent);
		progress.setTargetValue(target);
		progress.setLastEventAt(effectiveMeasuredAt);

		if (shouldBeCompleted) {
			if (!Boolean.TRUE.equals(progress.getIsCompleted())) {
				progress.setUnlockedAt(effectiveMeasuredAt);
			}
			progress.setIsCompleted(true);

			if (!studentAchievementRepository.existsByStudent_IdAndAchievement_Key(studentId, achievementKey)) {
				studentAchievementRepository.save(StudentAchievement.builder().student(student).achievement(definition)
						.unlockedAt(progress.getUnlockedAt() != null ? progress.getUnlockedAt() : effectiveMeasuredAt)
						.build());
			}
		}

		achievementProgressRepository.save(progress);
	}
}
