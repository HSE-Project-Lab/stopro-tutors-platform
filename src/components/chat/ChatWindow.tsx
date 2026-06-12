import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { Send, Trash2, Reply, Pin, PinOff, Copy, Pencil, CheckSquare, X, Eye } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { webSocketService } from '@/lib/websocket';
import type { ChatEvent, ChatMessage, MessageReadInfo } from '@/types/chat';

interface ChatWindowProps {
  chatId: string;
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

export function ChatWindow({ chatId }: ChatWindowProps) {
  const { user, token } = useAuthStore();
  const {
    messages,
    loadedChats,
    groupChats,
    addMessage,
    updateMessage,
    deleteMessage,
    setMessages,
    markChatLoaded,
    updateChatUnreadCount,
    applyReadReceipt,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [stickyDate, setStickyDate] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState<{ msg: ChatMessage; x: number; y: number } | null>(null);
  const [pinnedPointer, setPinnedPointer] = useState<number | null>(null);
  const [readInfo, setReadInfo] = useState<{ loading: boolean; list: MessageReadInfo[] }>({
    loading: false,
    list: [],
  });
  const [showViewers, setShowViewers] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const markedRef = useRef<Set<string>>(new Set());
  const chatIdRef = useRef(chatId);
  chatIdRef.current = chatId;
  const initialUnreadRef = useRef(0);
  const initializedRef = useRef(false);
  const prevLenRef = useRef(0);
  const [loadSeq, setLoadSeq] = useState(0);

  const chatMessages = messages[chatId] || [];
  const isLoaded = loadedChats[chatId] === true;
  const isGroupChat = groupChats.some((c) => c.id === chatId);
  const isTeacher = user?.role === 'TEACHER';

  const pinnedMessages = chatMessages.filter((m) => m.isPinned && m.messageType === 'TEXT');
  const pinnedIndex = pinnedPointer ?? pinnedMessages.length - 1;
  const pinnedBarMessage = pinnedMessages[pinnedIndex] ?? null;

  useEffect(() => {
    loadMessages();
    const subscribe = () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      unsubscribeRef.current = webSocketService.subscribeToChatMessages(chatId, (event: ChatEvent) => {
        if (event.type === 'MESSAGE_SENT') {
          addMessage(chatId, event.message!);
        } else if (
          event.type === 'MESSAGE_EDITED' ||
          event.type === 'MESSAGE_PINNED' ||
          event.type === 'MESSAGE_UNPINNED'
        ) {
          updateMessage(chatId, event.message!);
        } else if (event.type === 'MESSAGE_DELETED') {
          deleteMessage(chatId, event.messageId!);
        } else if (event.type === 'MESSAGE_READ') {
          applyReadReceipt(chatId, event.messageId!, event.readerId!);
        }
      });
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
      observerRef.current?.disconnect();
      observerRef.current = null;
      markedRef.current.clear();
      setReplyTo(null);
      setEditingId(null);
      setSelectionMode(false);
      setSelectedIds(new Set());
      setMenu(null);
    };
  }, [chatId, token]);

  useLayoutEffect(() => {
    if (loadSeq === 0) return;
    const container = messagesContainerRef.current;
    if (!container) return;

    const unread = initialUnreadRef.current;
    if (unread > 0) {
      const firstUnreadId = findFirstUnreadId(chatMessages, unread, user?.id);
      const node = firstUnreadId
        ? (container.querySelector(`[data-msg-id="${firstUnreadId}"]`) as HTMLElement | null)
        : null;
      if (node) {
        const delta = node.getBoundingClientRect().bottom - container.getBoundingClientRect().bottom;
        container.scrollTop += delta;
        initializedRef.current = true;
        prevLenRef.current = chatMessages.length;
        return;
      }
    }
    container.scrollTop = container.scrollHeight;
    initializedRef.current = true;
    prevLenRef.current = chatMessages.length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadSeq]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const grew = chatMessages.length > prevLenRef.current;
    prevLenRef.current = chatMessages.length;
    if (!grew) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
    if (nearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const getObserver = () => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const id = (entry.target as HTMLElement).dataset.msgId;
            if (id && !markedRef.current.has(id)) {
              markedRef.current.add(id);
              webSocketService.markRead(chatIdRef.current, id);
            }
            observerRef.current?.unobserve(entry.target);
          });
        },
        { threshold: 0.6 }
      );
    }
    return observerRef.current;
  };

  const observeRead = useCallback((node: HTMLDivElement | null) => {
    if (node) getObserver().observe(node);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (el.getBoundingClientRect().top <= containerTop) {
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

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  useEffect(() => {
    setPinnedPointer(null);
  }, [chatId, pinnedMessages.length]);

  const scrollToMessage = (messageId: string) => {
    const node = messagesContainerRef.current?.querySelector(`[data-msg-id="${messageId}"]`);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    node.classList.add('ring-2', 'ring-blue-400');
    window.setTimeout(() => node.classList.remove('ring-2', 'ring-blue-400'), 1500);
  };

  const handlePinnedBarClick = () => {
    if (pinnedMessages.length === 0) return;
    const idx = pinnedIndex;
    scrollToMessage(pinnedMessages[idx].id);
    setPinnedPointer(idx <= 0 ? pinnedMessages.length - 1 : idx - 1);
  };

  const loadMessages = async () => {
    const state = useChatStore.getState();
    const chat = [...state.personalChats, ...state.groupChats].find((c) => c.id === chatId);
    initialUnreadRef.current = chat?.unreadCount ?? 0;
    initializedRef.current = false;
    prevLenRef.current = 0;
    try {
      const pageSize = 100;
      let page = 0;
      let all: ChatMessage[] = [];
      while (page < 200) {
        const response = await api.get(`/chats/${chatId}/messages`, { params: { page, pageSize } });
        const data = response.data;
        const content: ChatMessage[] = data?.content ?? (Array.isArray(data) ? data : []);
        all = all.concat(content);
        const totalPages: number = typeof data?.totalPages === 'number' ? data.totalPages : 1;
        page += 1;
        if (page >= totalPages || content.length < pageSize) break;
      }
      setMessages(chatId, all);
      markChatLoaded(chatId);
      setLoadSeq((s) => s + 1);
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
      webSocketService.sendMessage(chatId, input, replyTo?.id ?? null);
      setInput('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const openMenu = async (msg: ChatMessage, clientX: number, clientY: number) => {
    const width = 200;
    const x = Math.max(8, Math.min(clientX - width, window.innerWidth - width - 8));
    const y = Math.min(clientY + 8, window.innerHeight - 320);
    setMenu({ msg, x, y: Math.max(8, y) });
    setShowViewers(false);
    setReadInfo({ loading: false, list: [] });
    if (msg.senderId === user?.id) {
      setReadInfo({ loading: true, list: [] });
      try {
        const resp = await api.get(`/chats/messages/${msg.id}/read-by`);
        setReadInfo({ loading: false, list: resp.data });
      } catch {
        setReadInfo({ loading: false, list: [] });
      }
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return;
    webSocketService.editMessage(chatId, editingId, editText);
    setEditingId(null);
    setEditText('');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enterSelection = (id: string) => {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const bulkDelete = () => {
    selectedIds.forEach((id) => webSocketService.deleteMessage(chatId, id));
    exitSelection();
  };

  const bulkCopy = () => {
    const text = chatMessages
      .filter((m) => selectedIds.has(m.id))
      .map((m) => m.content)
      .join('\n');
    handleCopy(text);
    exitSelection();
  };

  const formatDateDivider = (date: Date) => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric';
    return date.toLocaleDateString('ru-RU', options);
  };

  const renderMessages = () => {
    if (!isLoaded && chatMessages.length === 0) return null;
    if (chatMessages.length === 0) {
      return (
        <div key="no-messages" className="text-center text-gray-500 py-8">
          Нет сообщений
        </div>
      );
    }
    const elements: React.ReactNode[] = [];
    let lastDate: string | null = null;
    chatMessages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toLocaleDateString('ru-RU');
      if (msgDate !== lastDate) {
        const formattedDate = formatDateDivider(new Date(msg.createdAt));
        elements.push(
          <div key={`divider-${msg.id}`} data-date={formattedDate} className="flex justify-center my-1">
            <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">{formattedDate}</span>
          </div>
        );
        lastDate = msgDate;
      }
      if (msg.messageType === 'SYSTEM') {
        elements.push(
          <div key={msg.id} className="flex justify-center my-1">
            <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">{msg.content}</span>
          </div>
        );
        return;
      }
      const isOwn = user?.id ? msg.senderId === user.id : false;
      const shouldObserve = !isOwn && !msg.isReadByCurrentUser;
      elements.push(
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwnMessage={isOwn}
          selectionMode={selectionMode}
          selected={selectedIds.has(msg.id)}
          isEditing={editingId === msg.id}
          editText={editText}
          onEditTextChange={setEditText}
          onSaveEdit={saveEdit}
          onCancelEdit={() => setEditingId(null)}
          onToggleSelect={() => toggleSelect(msg.id)}
          onContextMenu={(e) => {
            e.preventDefault();
            if (selectionMode) return;
            openMenu(msg, e.clientX, e.clientY);
          }}
          observeRead={shouldObserve ? observeRead : null}
        />
      );
    });
    return elements;
  };

  return (
    <div className="flex flex-col h-full">
      {selectionMode && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
          <span className="text-sm font-medium text-blue-700">Выбрано: {selectedIds.size}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={bulkCopy}
              disabled={selectedIds.size === 0}
              className="px-3 py-1 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Копировать
            </button>
            <button
              onClick={bulkDelete}
              disabled={selectedIds.size === 0}
              className="px-3 py-1 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Удалить
            </button>
            <button onClick={exitSelection} className="px-3 py-1 text-sm rounded-lg hover:bg-gray-100">
              Отмена
            </button>
          </div>
        </div>
      )}

      {!selectionMode && pinnedBarMessage && (
        <button
          onClick={handlePinnedBarClick}
          className="flex items-center gap-2 w-full px-4 py-2 border-b border-gray-200 bg-white hover:bg-gray-50 text-left"
        >
          <div className="w-0.5 self-stretch bg-blue-500 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600">Закреплённые сообщения</p>
            <p className="text-sm text-gray-700 truncate">{pinnedBarMessage.content}</p>
          </div>
          <Pin className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>
      )}

      {stickyDate && !selectionMode && (
        <div className="sticky top-0 z-10 flex justify-center py-1">
          <span className="px-3 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">{stickyDate}</span>
        </div>
      )}

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto pt-0 pb-2 pl-4 pr-2 space-y-2">
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-gray-200 bg-gray-50">
          <Reply className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0 border-l-2 border-blue-500 pl-2">
            <p className="text-xs font-semibold text-blue-700">{replyTo.senderName}</p>
            <p className="text-xs text-gray-600 truncate">{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-gray-200 rounded">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <input
            ref={inputRef}
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

      {menu && (
        <MessageContextMenu
          message={menu.msg}
          x={menu.x}
          y={menu.y}
          isOwn={menu.msg.senderId === user?.id}
          isTeacher={isTeacher}
          isGroupChat={isGroupChat}
          readInfo={readInfo}
          showViewers={showViewers}
          onToggleViewers={() => setShowViewers((v) => !v)}
          onReply={() => {
            setReplyTo(menu.msg);
            setMenu(null);
            inputRef.current?.focus();
          }}
          onPin={() => {
            if (menu.msg.isPinned) webSocketService.unpinMessage(chatId, menu.msg.id);
            else webSocketService.pinMessage(chatId, menu.msg.id);
            setMenu(null);
          }}
          onCopy={() => {
            handleCopy(menu.msg.content);
            setMenu(null);
          }}
          onDelete={() => {
            webSocketService.deleteMessage(chatId, menu.msg.id);
            setMenu(null);
          }}
          onEdit={() => {
            startEdit(menu.msg);
            setMenu(null);
          }}
          onSelect={() => {
            enterSelection(menu.msg.id);
            setMenu(null);
          }}
        />
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  selectionMode: boolean;
  selected: boolean;
  isEditing: boolean;
  editText: string;
  onEditTextChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  observeRead: ((node: HTMLDivElement | null) => void) | null;
}

function MessageBubble({
  message,
  isOwnMessage,
  selectionMode,
  selected,
  isEditing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onToggleSelect,
  onContextMenu,
  observeRead,
}: MessageBubbleProps) {
  const align = isOwnMessage ? 'justify-end' : 'justify-start';

  return (
    <div
      className={`flex items-center gap-2 ${align} ${selectionMode ? 'cursor-pointer' : ''} ${
        selected ? 'bg-blue-50 rounded-lg' : ''
      }`}
      onClick={selectionMode ? onToggleSelect : undefined}
      onContextMenu={onContextMenu}
    >
      {selectionMode && (
        <input type="checkbox" checked={selected} readOnly className="ml-1 flex-shrink-0" />
      )}
      <div
        ref={observeRead}
        data-msg-id={message.id}
        className={`relative max-w-xs px-4 py-2 rounded-lg ${
          isOwnMessage ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'
        }`}
      >
        {!isOwnMessage && <p className="text-xs font-semibold mb-1">{message.senderName}</p>}

        {message.replyToId && (
          <div
            className={`mb-1 border-l-2 pl-2 text-xs ${
              isOwnMessage ? 'border-blue-200 text-blue-100' : 'border-blue-500 text-gray-600'
            }`}
          >
            <span className="font-semibold">{message.replyToSenderName}</span>
            <p className="truncate">{message.replyToPreview}</p>
          </div>
        )}

        {isEditing ? (
          <div className="space-y-2">
            <input
              autoFocus
              value={editText}
              onChange={(e) => onEditTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveEdit();
                if (e.key === 'Escape') onCancelEdit();
              }}
              className="w-full px-2 py-1 rounded text-gray-900 text-sm"
            />
            <div className="flex gap-2 text-xs">
              <button onClick={onSaveEdit} className="underline">
                Сохранить
              </button>
              <button onClick={onCancelEdit} className="underline opacity-80">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <p className="break-words">{message.content}</p>
        )}

        <div className="flex items-center justify-end gap-1 mt-1 text-xs">
          <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-600'}>
            {formatTime(message.createdAt)}
          </span>
          {message.isEdited && (
            <span className={isOwnMessage ? 'text-blue-100' : 'text-gray-600'}>(ред.)</span>
          )}
          {message.isPinned && <Pin className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
}

interface MessageContextMenuProps {
  message: ChatMessage;
  x: number;
  y: number;
  isOwn: boolean;
  isTeacher: boolean;
  isGroupChat: boolean;
  readInfo: { loading: boolean; list: MessageReadInfo[] };
  showViewers: boolean;
  onToggleViewers: () => void;
  onReply: () => void;
  onPin: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onSelect: () => void;
}

function MessageContextMenu({
  message,
  x,
  y,
  isOwn,
  isTeacher,
  isGroupChat,
  readInfo,
  showViewers,
  onToggleViewers,
  onReply,
  onPin,
  onCopy,
  onDelete,
  onEdit,
  onSelect,
}: MessageContextMenuProps) {
  const item =
    'w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 transition-colors';

  const readLine = () => {
    if (!isOwn) return null;
    if (isGroupChat) {
      const count = readInfo.loading ? message.readCount : readInfo.list.length;
      return (
        <div className="border-t border-gray-100">
          <button onClick={onToggleViewers} className={`${item} text-gray-500`}>
            <Eye className="w-4 h-4" />
            {count} просмотр{pluralViews(count)}
          </button>
          {showViewers && (
            <div className="max-h-40 overflow-y-auto px-3 pb-2">
              {readInfo.loading ? (
                <p className="text-xs text-gray-400 py-1">Загрузка...</p>
              ) : readInfo.list.length === 0 ? (
                <p className="text-xs text-gray-400 py-1">Пока никто не просмотрел</p>
              ) : (
                readInfo.list.map((r) => (
                  <div key={r.userId} className="flex justify-between text-xs text-gray-600 py-0.5">
                    <span className="truncate mr-2">{r.userName}</span>
                    <span className="flex-shrink-0">{formatTime(r.readAt)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
        {readInfo.loading
          ? 'Загрузка...'
          : readInfo.list.length > 0
            ? `Прочитано в ${formatTime(readInfo.list[0].readAt)}`
            : 'Доставлено'}
      </div>
    );
  };

  return (
    <div
      className="fixed z-50 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button className={item} onClick={onReply}>
        <Reply className="w-4 h-4" />
        Ответить
      </button>

      {isOwn && isTeacher && (
        <button className={item} onClick={onPin}>
          {message.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
          {message.isPinned ? 'Открепить' : 'Закрепить'}
        </button>
      )}

      <button className={item} onClick={onCopy}>
        <Copy className="w-4 h-4" />
        Копировать
      </button>

      {isOwn && (
        <button className={item} onClick={onEdit}>
          <Pencil className="w-4 h-4" />
          Редактировать
        </button>
      )}

      {(isOwn || isTeacher) && (
        <button className={`${item} text-red-600`} onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
          Удалить
        </button>
      )}

      <button className={item} onClick={onSelect}>
        <CheckSquare className="w-4 h-4" />
        Выбрать
      </button>

      {readLine()}
    </div>
  );
}

function findFirstUnreadId(
  messages: ChatMessage[],
  unreadCount: number,
  userId: string | undefined
): string | null {
  let remaining = unreadCount;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.messageType === 'TEXT' && m.senderId !== userId) {
      remaining -= 1;
      if (remaining === 0) return m.id;
    }
  }
  return null;
}

function pluralViews(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return '';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'а';
  return 'ов';
}
