import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { webSocketService } from '@/lib/websocket';
import api from '@/lib/axios';
import { Mail, Search, Users, User } from 'lucide-react';
import type { ChatEvent, PersonalChat, GroupChat } from '@/types/chat';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { htmlToInlineText } from '@/lib/richText';

export function ChatsPage() {
  const { user, token } = useAuthStore();
  const {
    selectedChatId,
    personalChats,
    groupChats,
    setSelectedChat,
    setPersonalChats,
    setGroupChats,
    setMessages,
    markChatLoaded,
    updateChatUnreadCount,
    updateChatLastMessage,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const chatSubscriptionsRef = useRef<Map<string, () => void>>(new Map());
  const privateSubscriptionRef = useRef<(() => void) | null>(null);

  const setupChatSubscriptions = () => {
    const { personalChats: pc, groupChats: gc } = useChatStore.getState();
    [...pc, ...gc].forEach((chat) => {
      if (chatSubscriptionsRef.current.has(chat.id)) return;
      const unsubscribe = webSocketService.subscribeToChatMessages(chat.id, (event: ChatEvent) => {
        if (event.type !== 'MESSAGE_SENT') return;
        if (event.message?.messageType !== 'TEXT') return;
        const message = event.message;
        const plainPreview = htmlToInlineText(message.content);
        const preview =
          plainPreview || (message.attachments?.length ? `📎 ${message.attachments[0].fileName}` : '');
        updateChatLastMessage(chat.id, {
          preview,
          senderName: message.senderName,
          senderId: message.senderId,
          lastMessageAt: message.createdAt,
        });
        const state = useChatStore.getState();
        if (chat.id === state.selectedChatId) return;
        const current = [...state.personalChats, ...state.groupChats].find((c) => c.id === chat.id);
        updateChatUnreadCount(chat.id, (current?.unreadCount ?? 0) + 1);
      });
      if (unsubscribe !== null) {
        chatSubscriptionsRef.current.set(chat.id, unsubscribe);
      }
    });
  };

  const setupPrivateSubscription = () => {
    if (privateSubscriptionRef.current) return;
    const userId = user?.id;
    if (!userId) return;
    const unsubscribe = webSocketService.subscribeToUserNotifications(userId, (notification: any) => {
      if (notification.type === 'new_chat') {
        loadChats().then(() => setupChatSubscriptions());
      } else if (notification.type === 'chat_removed') {
        const removedId = notification.chatId;
        const unsub = chatSubscriptionsRef.current.get(removedId);
        if (unsub) {
          unsub();
          chatSubscriptionsRef.current.delete(removedId);
        }
        useChatStore.getState().removeChat(removedId);
      }
    });
    if (unsubscribe !== null) {
      privateSubscriptionRef.current = unsubscribe;
    }
  };

  useEffect(() => {
    const wsHandler = (connected: boolean) => {
      if (connected) {
        setupPrivateSubscription();
        setupChatSubscriptions();
      }
    };
    webSocketService.onConnectionStatusChange(wsHandler);

    loadChats().then(() => setupChatSubscriptions());

    if (token && !webSocketService.isConnected()) {
      webSocketService.connect(token);
    } else if (webSocketService.isConnected()) {
      setupPrivateSubscription();
      setupChatSubscriptions();
    }

    return () => {
      chatSubscriptionsRef.current.forEach((unsub) => unsub());
      chatSubscriptionsRef.current.clear();
      privateSubscriptionRef.current?.();
      privateSubscriptionRef.current = null;
      webSocketService.removeConnectionStatusHandler(wsHandler);
    };
  }, [token]);

  const preloadAllMessages = (chats: (PersonalChat | GroupChat)[]) => {
    chats.forEach(async (chat) => {
      if (!useChatStore.getState().loadedChats[chat.id]) {
        try {
          const response = await api.get(`/chats/${chat.id}/messages`);
          setMessages(chat.id, response.data.content || response.data);
          markChatLoaded(chat.id);
        } catch (error) {
          console.error(`Error preloading messages for chat ${chat.id}:`, error);
        }
      }
    });
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      let allChats: (PersonalChat | GroupChat)[] = [];

      if (user?.role === 'TEACHER') {
        const personalResponse = await api.get('/chats/personal');
        const groupResponse = await api.get('/chats/groups');
        setPersonalChats(personalResponse.data);
        setGroupChats(groupResponse.data);
        allChats = [...personalResponse.data, ...groupResponse.data];
      } else {
        const response = await api.get('/chats');
        const personal = response.data.filter((c: any) => c.chatType === 'PERSONAL');
        const groups = response.data.filter((c: any) => c.chatType === 'GROUP');
        setPersonalChats(personal);
        setGroupChats(groups);
        allChats = response.data;
      }

      preloadAllMessages(allChats);
      return allChats;
    } catch (error) {
      console.error('Error loading chats:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const filteredChats =
    activeTab === 'personal'
      ? personalChats.filter((c) =>
          !searchQuery || c.counterpartName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : groupChats.filter((c) =>
          !searchQuery || c.chatName?.toLowerCase().includes(searchQuery.toLowerCase())
        );

  return (
    <div className="flex -m-6 bg-gray-50" style={{ height: 'calc(100vh - 4rem)' }}>
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Чаты</h2>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab('personal')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'personal'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mail className="inline-block w-4 h-4 mr-2" />
              Личные
            </button>
            <button
              onClick={() => setActiveTab('group')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'group'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Группы
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-20 text-gray-500">
              Загрузка...
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {activeTab === 'group' ? 'Групповых чатов нет' : 'Личных чатов нет'}
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isPersonal = activeTab === 'personal';
              const avatarUrl = isPersonal
                ? (chat as PersonalChat).counterpartAvatarUrl
                : (chat as GroupChat).chatAvatarUrl;
              const name = isPersonal
                ? (chat as PersonalChat).counterpartName
                : (chat as GroupChat).chatName;

              const prefix = chat.lastMessageSenderId
                ? chat.lastMessageSenderId === user?.id
                  ? 'Вы'
                  : chat.lastMessageSenderName
                : null;
              const previewText = chat.lastMessagePreview
                ? prefix
                  ? `${prefix}: ${chat.lastMessagePreview}`
                  : chat.lastMessagePreview
                : 'Нет сообщений';

              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id, activeTab)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedChatId === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                      ) : isPersonal ? (
                        <User className="w-6 h-6 text-gray-500" />
                      ) : (
                        <Users className="w-6 h-6 text-gray-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{name}</h3>
                      <p className="text-sm text-gray-500 truncate">{previewText}</p>
                    </div>

                    {chat.unreadCount > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-white">
        {selectedChatId ? (
          <ChatWindow chatId={selectedChatId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Выберите чат для начала общения
          </div>
        )}
      </div>
    </div>
  );
}