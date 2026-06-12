package ru.stopro.controller.ws;

import java.security.Principal;
import java.util.UUID;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import lombok.extern.slf4j.Slf4j;

import ru.stopro.dto.chat.ChatEvent;
import ru.stopro.dto.chat.ChatMessageDto;
import ru.stopro.dto.chat.EditMessageRequest;
import ru.stopro.dto.chat.SendMessageRequest;
import ru.stopro.service.chat.ChatMessageService;

@Controller
@Slf4j
public class ChatWebSocketController {

	private final ChatMessageService chatMessageService;

	public ChatWebSocketController(ChatMessageService chatMessageService) {
		this.chatMessageService = chatMessageService;
	}

	@MessageMapping("/chat/{chatId}/send")
	@SendTo("/topic/chat/{chatId}")
	public ChatEvent sendMessage(
			@DestinationVariable UUID chatId,
			@Payload SendMessageRequest request,
			Principal principal) {
		UUID senderId = UUID.fromString(principal.getName());
		ChatMessageDto savedMessage = chatMessageService.sendMessage(chatId, senderId, request.content());
		log.info("Message sent to chat {} by user {}", chatId, senderId);
		return ChatEvent.sent(savedMessage);
	}

	@MessageMapping("/chat/{chatId}/edit/{messageId}")
	@SendTo("/topic/chat/{chatId}")
	public ChatEvent editMessage(
			@DestinationVariable UUID chatId,
			@DestinationVariable UUID messageId,
			@Payload EditMessageRequest request,
			Principal principal) {
		UUID editorId = UUID.fromString(principal.getName());
		ChatMessageDto updatedMessage = chatMessageService.editMessage(messageId, editorId, request.content());
		log.info("Message {} edited in chat {} by user {}", messageId, chatId, editorId);
		return ChatEvent.edited(updatedMessage);
	}

	@MessageMapping("/chat/{chatId}/delete/{messageId}")
	@SendTo("/topic/chat/{chatId}")
	public ChatEvent deleteMessage(
			@DestinationVariable UUID chatId,
			@DestinationVariable UUID messageId,
			Principal principal) {
		UUID deleterId = UUID.fromString(principal.getName());
		chatMessageService.deleteMessage(messageId, deleterId);
		log.info("Message {} deleted in chat {} by user {}", messageId, chatId, deleterId);
		return ChatEvent.deleted(messageId);
	}

	@MessageMapping("/chat/{chatId}/pin/{messageId}")
	@SendTo("/topic/chat/{chatId}")
	public ChatEvent pinMessage(
			@DestinationVariable UUID chatId,
			@DestinationVariable UUID messageId,
			Principal principal) {
		UUID teacherId = UUID.fromString(principal.getName());
		ChatMessageDto pinnedMessage = chatMessageService.pinMessage(messageId, teacherId);
		log.info("Message {} pinned in chat {} by user {}", messageId, chatId, teacherId);
		return ChatEvent.pinned(pinnedMessage);
	}

	@MessageMapping("/chat/{chatId}/unpin/{messageId}")
	@SendTo("/topic/chat/{chatId}")
	public ChatEvent unpinMessage(
			@DestinationVariable UUID chatId,
			@DestinationVariable UUID messageId,
			Principal principal) {
		UUID teacherId = UUID.fromString(principal.getName());
		ChatMessageDto unpinnedMessage = chatMessageService.unpinMessage(messageId, teacherId);
		log.info("Message {} unpinned in chat {} by user {}", messageId, chatId, teacherId);
		return ChatEvent.unpinned(unpinnedMessage);
	}
}
