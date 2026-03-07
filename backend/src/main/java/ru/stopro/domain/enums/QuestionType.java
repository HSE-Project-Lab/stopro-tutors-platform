package ru.stopro.domain.enums;

/**
 * Тип вопроса/задачи
 */
public enum QuestionType {
	/**
	 * Краткий ответ (число, выражение) Задания ЕГЭ части 1
	 */
	SHORT_ANSWER,

	/**
	 * Развёрнутый ответ с решением Задания ЕГЭ части 2 (13-19)
	 */
	LONG_ANSWER,

	/**
	 * Множественный выбор
	 */
	MULTIPLE_CHOICE,

	/**
	 * Выбор нескольких правильных ответов
	 */
	MULTIPLE_SELECT,

	/**
	 * Сопоставление (matching)
	 */
	MATCHING,

	/**
	 * Упорядочивание (ordering)
	 */
	ORDERING,

	/**
	 * Заполнение пропусков
	 */
	FILL_BLANKS,

	/**
	 * Истина/Ложь
	 */
	TRUE_FALSE,

	/**
	 * Графическая задача (интерактивная)
	 */
	GRAPHICAL,

	/**
	 * Эссе / свободный ответ
	 */
	ESSAY
}
