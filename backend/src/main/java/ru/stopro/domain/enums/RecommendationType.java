package ru.stopro.domain.enums;

/**
 * Типы рекомендаций от ИИ
 */
public enum RecommendationType {
	WEAK_TOPIC, // Слабая тема - нужно подтянуть
	STRONG_TOPIC, // Сильная тема - можно развивать дальше
	STREAK, // Напоминание о серии дней
	TARGET_SCORE, // Рекомендация по целевому баллу
	PRACTICE, // Рекомендация к практике
	REVIEW, // Рекомендация к повторению
	NEW_TOPIC // Новая тема для изучения
}
