package ru.stopro.domain.enums;

/**
 * Статус чата.
 */
public enum ChatStatus {
	/** Активный чат */
	ACTIVE,
	/** Архивированный чат (не удален, но скрыт) */
	ARCHIVED,
	/** Чат в процессе удаления (отложенное удаление) */
	PENDING_DELETION
}

