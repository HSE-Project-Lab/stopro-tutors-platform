package ru.stopro.security;

import java.security.Principal;
import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.stereotype.Component;

import ru.stopro.config.DemoDataLoader;
import ru.stopro.domain.entity.User;
import ru.stopro.repository.UserRepository;
import ru.stopro.repository.chat.ChatParticipantRepository;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtWebSocketInterceptor implements ChannelInterceptor {

	private static final String CHAT_TOPIC_PREFIX = "/topic/chat/";

	private final JwtService jwtService;
	private final UserRepository userRepository;
	private final ChatParticipantRepository chatParticipantRepository;

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null) {
			return message;
		}

		if (StompCommand.CONNECT.equals(accessor.getCommand())) {
			String authHeader = accessor.getFirstNativeHeader("Authorization");
			if (authHeader != null && authHeader.startsWith("Bearer ")) {
				String token = authHeader.substring(7);
				try {
					String username;
					boolean isDemoToken = "demo-token-teacher".equals(token) || "demo-token-student".equals(token);
					if ("demo-token-teacher".equals(token)) {
						username = DemoDataLoader.DEMO_TEACHER_USERNAME;
					} else if ("demo-token-student".equals(token)) {
						username = DemoDataLoader.DEMO_STUDENT_USERNAME;
					} else {
						username = jwtService.extractUsername(token);
					}
					User user = userRepository.findByUsername(username).orElse(null);
					if (user != null && (isDemoToken || jwtService.isTokenValid(token, user))) {
						final UUID userId = user.getId();
						accessor.setUser(() -> userId.toString());
						log.debug("WebSocket authenticated: user {}", userId);
					}
				} catch (Exception e) {
					log.warn("WebSocket authentication failed: {}", e.getMessage());
				}
			}
		} else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
			String destination = accessor.getDestination();
			if (destination != null && destination.startsWith(CHAT_TOPIC_PREFIX)) {
				String chatIdStr = destination.substring(CHAT_TOPIC_PREFIX.length());
				Principal principal = accessor.getUser();
				if (principal == null) {
					log.warn("Unauthenticated SUBSCRIBE attempt to {}", destination);
					return null;
				}
				try {
					UUID chatId = UUID.fromString(chatIdStr);
					UUID userId = UUID.fromString(principal.getName());
					if (!chatParticipantRepository.isUserInChat(chatId, userId)) {
						log.warn("User {} attempted to subscribe to unauthorized chat {}", userId, chatId);
						return null;
					}
				} catch (IllegalArgumentException e) {
					log.warn("Invalid chat ID in subscription destination: {}", destination);
					return null;
				}
			}
		}

		return message;
	}
}