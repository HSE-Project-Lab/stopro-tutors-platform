import { useEffect, useRef, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { Send, Trash2 } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { webSocketService } from '@/lib/websocket';
import type { ChatEvent, ChatMessage } from '@/types/chat';

interface ChatWindowProps {
  chatId: string;
}

export function ChatWindow({ chatId }: ChatWindowProps) {
  const { user, token } = useAuthStore();
  const { messages, loadedChats, addMessage, updateMessage, deleteMessage, setMessages, markChatLoaded, updateChatUnreadCount } = useChatStore();
  const [input, setInput] = useState('');
  const [stickyDate, setStickyDate] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const chatMessages = messages[chatId] || [];
  const isLoaded = loadedChats[chatId] === true;

  useEffect(() => {
    loadMessages();
    const subscribe = () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      unsubscribeRef.current = webSocketService.subscribeToChatMessages(
        chatId,
        (event: ChatEvent) => {
          if (event.type === 'MESSAGE_SENT') {
            addMessage(chatId, event.message!);
          } else if (event.type === 'MESSAGE_EDITED' || event.type === 'MESSAGE_PINNED' || event.type === 'MESSAGE_UNPINNED') {
            updateMessage(chatId, event.message!);
          } else if (event.type === 'MESSAGE_DELETED') {
            deleteMessage(chatId, event.messageId!);
          }
        }
      );
    };
    if (token && !webSocketService.isConnected()) {
      webSocketService.connect(token, () => subscribe());
    } else if (webSocketService.isConnected()) {
      subscribe();
    }
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [chatId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const container = messagesContainerRef.current;
    const dividers = container.querySelectorAll('[data-date]');
    if (dividers.length === 0) {
      setStickyDate(null);
      return;
    }
    const containerTop = container.getBoundingClientRect().top;
    let activeDate: string | null = null;
    for (let i = dividers.length - 1; i >= 0; i--) {
      const el = dividers[i] as HTMLElement;
      const rect = el.getBoundingClientRect();
      if (rect.top <= containerTop) {
        activeDate = el.dataset.date || null;
        break;
      }
    }
    setStickyDate(activeDate);
  }, []);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
    return () => {
      if (container) container.removeEventListener('scroll', handleScroll);
    };
  }, [chatMessages, handleScroll]);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/chats/${chatId}/messages`);
      setMessages(chatId, response.data.content || response.data);
      markChatLoaded(chatId);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
    try {
      await api.post(`/chats/${chatId}/mark-read`);
      updateChatUnreadCount(chatId, 0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;
    try {
      webSocketService.sendMessage(chatId, input);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    try {
      webSocketService.deleteMessage(chatId, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatDateDivider = (date: Date) => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    if (date.getFullYear() !== now.getFullYear()) {
      options.year = 'numeric';
    }
    return date.toLocaleDateString('ru-RU', options);
  };

  const renderMessages = () => {
    if (!isLoaded && chatMessages.length === 0) {
      return null;
    }
    const elements: React.ReactNode[] = [];
    if (chatMessages.length === 0) {
      elements.push(
        <div key="no-messages" className="text-center text-gray-500 py-8">
          Нет сообщений
        </div>
      );
      return elements;
    }
    let lastDate: string | null = null;
    chatMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('ru-RU');
      if (msgDate !== lastDate) {
        const formattedDate = formatDateDivider(new Date(msg.createdAt));
        elements.push(
          <div
            key={`divider-${msg.id}`}
            data-date={formattedDate}
            className="flex justify-center my-1"
          >
            <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
              {formattedDate}
            </span>
          </div>
        );
        lastDate = msgDate;
      }
      const isOwn = user?.id ? msg.senderId === user.id : false;
      elements.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwnMessage={isOwn}
          onDelete={() => handleDeleteMessage(msg.id)}
        />
      );
    });
    return elements;
  };

  return (
    <div className="flex flex-col h-full">
      {stickyDate && (
        <div className="sticky top-0 z-10 flex justify-center py-1">
          <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
            {stickyDate}
          </span>
        </div>
      )}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto pt-0 pb-2 pl-4 pr-2 space-y-2"
      >
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Напишите сообщение..."
            maxLength={4096}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Отправить
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">{input.length}/4096</div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  onDelete: () => void;
}

function MessageBubble({ message, isOwnMessage, onDelete }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end mr-2' : 'justify-start ml-2'}`}>
      <div
        className={`relative max-w-xs px-4 py-2 rounded-lg ${
          isOwnMessage
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        {isOwnMessage ? (
          <div className="absolute bottom-0 right-0 transform translate-x-full">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-blue-600 border-b-[6px] border-b-transparent" />
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 transform -translate-x-full">
            <div className="w-0 h-0 border-t-[6px] border-t-transparent border-r-[8px] border-r-gray-200 border-b-[6px] border-b-transparent" />
          </div>
        )}
        {!isOwnMessage && (
          <p className="text-xs font-semibold mb-1">{message.senderName}</p>
        )}
        <p className="break-words">{message.content}</p>
        <div className="flex items-center justify-between mt-1 text-xs gap-2">
          <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-600'}>
            {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {isOwnMessage && message.isEdited && (
            <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-600'}>
              (ред.)
            </span>
          )}
          {isOwnMessage && (
            <button onClick={onDelete} className="hover:opacity-75" title="Удалить">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}