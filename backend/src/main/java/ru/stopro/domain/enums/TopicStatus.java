package ru.stopro.domain.enums;

/**
 * Статус освоения темы учеником
 */
public enum TopicStatus {
	NOT_STARTED, // Не начата
	IN_PROGRESS, // В процессе изучения
	WEAK, // Слабый уровень (<60%)
	NORMAL, // Нормальный уровень (60-80%)
	STRONG // Отличный уровень (>80%)
}
