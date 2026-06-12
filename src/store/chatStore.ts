import { create } from 'zustand';
import type { ChatMessage, PersonalChat, GroupChat } from '@/types/chat';

interface ChatStore {
  selectedChatId: string | null;
  chatType: 'PERSONAL' | 'GROUP' | null;
  personalChats: PersonalChat[];
  groupChats: GroupChat[];
  messages: Record<string, ChatMessage[]>;
  pinnedMessages: Record<string, ChatMessage[]>;
  loadedChats: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  setSelectedChat: (chatId: string | null, type?: 'PERSONAL' | 'GROUP') => void;
  setPersonalChats: (chats: PersonalChat[]) => void;
  setGroupChats: (chats: GroupChat[]) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
  updateMessage: (chatId: string, message: ChatMessage) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  setMessages: (chatId: string, messages: ChatMessage[]) => void;
  setPinnedMessages: (chatId: string, messages: ChatMessage[]) => void;
  markMessageAsRead: (chatId: string, messageId: string) => void;
  updateChatUnreadCount: (chatId: string, count: number) => void;
  markChatLoaded: (chatId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  clearChatMessages: (chatId: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  selectedChatId: null,
  chatType: null,
  personalChats: [],
  groupChats: [],
  messages: {},
  pinnedMessages: {},
  loadedChats: {},
  isLoading: false,
  error: null,
  searchQuery: '',

  setSelectedChat: (chatId, type) =>
    set({
      selectedChatId: chatId,
      chatType: type || null,
    }),

  setPersonalChats: (chats) =>
    set({
      personalChats: chats,
    }),

  setGroupChats: (chats) =>
    set({
      groupChats: chats,
    }),

  addMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] || []), message],
      },
    })),

  updateMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === message.id ? message : m
        ),
      },
    })),

  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId
            ? { ...m, content: 'Сообщение удалено', isDeleted: true }
            : m
        ),
      },
    })),

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: messages,
      },
    })),

  setPinnedMessages: (chatId, messages) =>
    set((state) => ({
      pinnedMessages: {
        ...state.pinnedMessages,
        [chatId]: messages,
      },
    })),

  markMessageAsRead: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] || []).map((m) =>
          m.id === messageId ? { ...m, isReadByCurrentUser: true } : m
        ),
      },
    })),

  updateChatUnreadCount: (chatId, count) =>
    set((state) => ({
      personalChats: state.personalChats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: count } : c
      ),
      groupChats: state.groupChats.map((c) =>
        c.id === chatId ? { ...c, unreadCount: count } : c
      ),
    })),

  markChatLoaded: (chatId) =>
    set((state) => ({
      loadedChats: { ...state.loadedChats, [chatId]: true },
    })),

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),

  setError: (error) =>
    set({
      error,
    }),

  setSearchQuery: (query) =>
    set({
      searchQuery: query,
    }),

  clearChatMessages: (chatId) =>
    set((state) => {
      const newMessages = { ...state.messages };
      delete newMessages[chatId];
      return { messages: newMessages };
    }),

  reset: () =>
    set({
      selectedChatId: null,
      chatType: null,
      personalChats: [],
      groupChats: [],
      messages: {},
      pinnedMessages: {},
      loadedChats: {},
      isLoading: false,
      error: null,
      searchQuery: '',
    }),
}));