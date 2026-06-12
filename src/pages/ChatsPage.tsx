import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import api from '@/lib/axios';
import { Mail, Search, Users, User } from 'lucide-react';
import type { PersonalChat, GroupChat } from '@/types/chat';
import { ChatWindow } from '@/components/chat/ChatWindow';

export function ChatsPage() {
  const { user } = useAuthStore();
  const {
    selectedChatId,
    personalChats,
    groupChats,
    setSelectedChat,
    setPersonalChats,
    setGroupChats,
    setMessages,
    markChatLoaded,
  } = useChatStore();

  const [activeTab, setActiveTab] = useState<'personal' | 'group'>('personal');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

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
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats =
    activeTab === 'personal'
      ? personalChats.filter((c) =>
          c.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : groupChats.filter((c) =>
          c.chatName?.toLowerCase().includes(searchQuery.toLowerCase())
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
                ? (chat as PersonalChat).studentAvatarUrl
                : (chat as GroupChat).chatAvatarUrl;
              const name = isPersonal
                ? (chat as PersonalChat).studentName
                : (chat as GroupChat).chatName;

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
                      <p className="text-sm text-gray-500 truncate">
                        {chat.lastMessageAt
                          ? new Date(chat.lastMessageAt).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Нет сообщений'}
                      </p>
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