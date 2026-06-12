import SockJS from 'sockjs-client';
import { Client, IFrame, IMessage } from '@stomp/stompjs';
import type { ChatMessage } from '@/types/chat';

/**
 * WebSocket service для реального общения в чате через STOMP protocol
 */
class WebSocketService {
  private client: Client | null = null;
  private token: string | null = null;
  private connected = false;
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private connectionHandlers: ((connected: boolean) => void)[] = [];

  /**
   * Инициализировать WebSocket соединение
   */
  connect(token: string, onConnect?: () => void, onError?: (error: any) => void) {
    if (this.connected && this.client?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    this.token = token;

    const sockJs = new SockJS('/api/v1/ws/chat');
    this.client = new Client({
      webSocketFactory: () => sockJs,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: (frame: IFrame) => {
        console.log('WebSocket connected', frame);
        this.connected = true;
        this.notifyConnectionStatus(true);
        onConnect?.();
      },
      onStompError: (frame: IFrame) => {
        console.error('WebSocket error:', frame);
        this.connected = false;
        this.notifyConnectionStatus(false);
        onError?.(frame);
      },
      onDisconnect: () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        this.notifyConnectionStatus(false);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.activate();
  }

  /**
   * Отключиться от WebSocket
   */
  disconnect() {
    if (this.client?.connected) {
      this.client.deactivate();
      this.connected = false;
      this.notifyConnectionStatus(false);
    }
  }

  /**
   * Отправить сообщение в чат
   */
  sendMessage(chatId: string, content: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${chatId}/send`,
      body: JSON.stringify({ content }),
    });
  }

  /**
   * Отредактировать сообщение
   */
  editMessage(chatId: string, messageId: string, content: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${chatId}/edit/${messageId}`,
      body: JSON.stringify({ content }),
    });
  }

  /**
   * Удалить сообщение
   */
  deleteMessage(chatId: string, messageId: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${chatId}/delete/${messageId}`,
    });
  }

  /**
   * Закрепить сообщение
   */
  pinMessage(chatId: string, messageId: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${chatId}/pin/${messageId}`,
    });
  }

  /**
   * Открепить сообщение
   */
  unpinMessage(chatId: string, messageId: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${chatId}/unpin/${messageId}`,
    });
  }

  /**
   * Пометить сообщение как прочитанное
   */
  markMessageAsRead(chatId: string, messageId: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${chatId}/mark-read/${messageId}`,
    });
  }

  /**
   * Пометить все сообщения в чате как прочитанные
   */
  markAllAsRead(chatId: string) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/app/chat/${chatId}/mark-all-read`,
    });
  }

  /**
   * Подписаться на сообщения чата
   */
  subscribeToChatMessages(chatId: string, handler: (message: ChatMessage) => void) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return () => {};
    }

    const subscription = this.client.subscribe(
      `/topic/chat/${chatId}`,
      (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          handler(body);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  /**
   * Подписаться на обновления прочтения сообщений
   */
  subscribeToReadReceipts(chatId: string, messageId: string, handler: (userId: string) => void) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return () => {};
    }

    const subscription = this.client.subscribe(
      `/topic/chat/${chatId}/read-receipts/${messageId}`,
      (message: IMessage) => {
        try {
          const userId = message.body;
          handler(userId);
        } catch (e) {
          console.error('Error parsing read receipt:', e);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  /**
   * Регистрировать обработчик сообщений
   */
  onMessage(key: string, handler: (message: any) => void) {
    this.messageHandlers.set(key, handler);
  }

  /**
   * Удалить обработчик сообщений
   */
  offMessage(key: string) {
    this.messageHandlers.delete(key);
  }

  /**
   * Подписаться на изменения статуса подключения
   */
  onConnectionStatusChange(handler: (connected: boolean) => void) {
    this.connectionHandlers.push(handler);
  }

  /**
   * Получить статус подключения
   */
  isConnected(): boolean {
    return this.connected && this.client?.connected === true;
  }

  /**
   * Отправить приватное сообщение пользователю
   */
  sendPrivateMessage(userId: string, message: any) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return;
    }

    this.client.publish({
      destination: `/user/${userId}/topic/notification`,
      body: JSON.stringify(message),
    });
  }

  /**
   * Подписаться на приватные сообщения
   */
  subscribeToPrivateMessages(handler: (message: any) => void) {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      return () => {};
    }

    const subscription = this.client.subscribe(
      `/user/topic/notification`,
      (message: IMessage) => {
        try {
          const body = JSON.parse(message.body);
          handler(body);
        } catch (e) {
          console.error('Error parsing private message:', e);
        }
      }
    );

    return () => subscription.unsubscribe();
  }

  /**
   * Уведомить об изменении статуса подключения
   */
  private notifyConnectionStatus(connected: boolean) {
    this.connectionHandlers.forEach((handler) => handler(connected));
  }
}

export const webSocketService = new WebSocketService();

