package ru.stopro.service.chat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import ru.stopro.domain.entity.Chat;
import ru.stopro.domain.entity.ChatInactivityWarning;
import ru.stopro.domain.enums.ChatStatus;
import ru.stopro.repository.chat.ChatInactivityWarningRepository;
import ru.stopro.repository.chat.ChatRepository;

/**
 * Плановые задачи для управления жизненным циклом неактивных чатов.
 * Логика: 6 месяцев без сообщений → предупреждение + PENDING_DELETION.
 * Если 7 дней нет активности после предупреждения → удаление чата.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatInactivityScheduler {

	private static final long INACTIVITY_MONTHS = 6;
	private static final long PENDING_DELETION_DAYS = 7;

	private final ChatRepository chatRepository;
	private final ChatInactivityWarningRepository chatInactivityWarningRepository;
	private final ChatMessageService chatMessageService;

	/**
	 * Помечает чаты без активности 6 месяцев как PENDING_DELETION и отправляет системное предупреждение.
	 * Запускается ежедневно в 03:00.
	 */
	@Scheduled(cron = "0 0 3 * * *")
	@Transactional
	public void markInactiveChats() {
		LocalDateTime threshold = LocalDateTime.now().minusMonths(INACTIVITY_MONTHS);
		List<Chat> inactiveChats = chatRepository.findChatsInactiveFor(threshold);

		if (inactiveChats.isEmpty()) {
			return;
		}

		log.info("Found {} inactive chats to warn", inactiveChats.size());

		for (Chat chat : inactiveChats) {
			LocalDateTime now = LocalDateTime.now();

			ChatInactivityWarning warning = ChatInactivityWarning.builder()
				.chat(chat)
				.warningSentAt(now)
				.scheduledDeletionAt(now.plusDays(PENDING_DELETION_DAYS))
				.warningDismissed(false)
				.build();
			chatInactivityWarningRepository.save(warning);

			chat.setStatus(ChatStatus.PENDING_DELETION);
			chatRepository.save(chat);

			chatMessageService.createSystemMessage(
				chat.getId(),
				"Чат не использовался 6 месяцев и будет удалён через 7 дней. Напишите сообщение, чтобы отменить удаление."
			);

			log.info("Chat {} marked PENDING_DELETION, scheduled deletion at {}", chat.getId(), warning.getScheduledDeletionAt());
		}
	}

	/**
	 * Удаляет чаты, у которых истёк срок ожидания после предупреждения.
	 * Запускается ежедневно в 03:30.
	 */
	@Scheduled(cron = "0 30 3 * * *")
	@Transactional
	public void deleteExpiredChats() {
		List<UUID> chatIds = chatInactivityWarningRepository.findChatsReadyForDeletion(LocalDateTime.now());

		if (chatIds.isEmpty()) {
			return;
		}

		log.info("Deleting {} expired inactive chats", chatIds.size());

		for (UUID chatId : chatIds) {
			chatRepository.findById(chatId).ifPresent(chat -> {
				chatRepository.delete(chat);
				log.info("Chat {} deleted due to inactivity", chatId);
			});
		}
	}
}
