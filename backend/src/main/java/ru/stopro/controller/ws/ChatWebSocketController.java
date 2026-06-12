package ru.stopro.controller.ws;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import lombok.extern.slf4j.Slf4j;
import ru.stopro.dto.chat.ChatMessageDto;
import ru.stopro.dto.chat.SendMessageRequest;
import ru.stopro.service.chat.ChatMessageService;
import java.util.UUID;

@Controller
@Slf4j
public class ChatWebSocketController {

	private final ChatMessageService chatMessageService;

	public ChatWebSocketController(ChatMessageService chatMessageService) {
		this.chatMessageService = chatMessageService;
	}

	@MessageMapping("/chat/{chatId}/send")
	@SendTo("/topic/chat/{chatId}")
	public ChatMessageDto sendMessage(
			@DestinationVariable UUID chatId,
			@Payload SendMessageRequest request) {
		UUID senderId = UUID.fromString("7ba96475-ace3-4344-a57c-3a2f7a7d93f2");
		ChatMessageDto savedMessage = chatMessageService.sendMessage(chatId, senderId, request.content());
		log.info("Message sent to chat {} by user {}", chatId, senderId);
		return savedMessage;
	}
}