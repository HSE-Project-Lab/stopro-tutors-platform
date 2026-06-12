export interface Chat {
  id: string;
  chatType: 'PERSONAL' | 'GROUP';
  teacherId: string;
  chatName: string | null;
  chatAvatarUrl: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'PENDING_DELETION';
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface PersonalChat extends Chat {
  counterpartId: string;
  counterpartName: string;
  counterpartAvatarUrl: string | null;
}

export interface GroupChat extends Chat {
  studyGroupId: string;
  memberCount: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  messageType: 'TEXT' | 'SYSTEM';
  content: string;
  attachments: MessageAttachment[];
  isEdited: boolean;
  editedAt: string | null;
  isPinned: boolean;
  pinnedAt: string | null;
  pinnedById: string | null;
  readCount: number;
  isReadByCurrentUser: boolean;
  readByUserIds: string[];
  replyToId: string | null;
  replyToSenderId: string | null;
  replyToSenderName: string | null;
  replyToPreview: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface MessageReadInfo {
  userId: string;
  userName: string;
  readAt: string;
}

export interface MessageAttachment {
  id: string;
  fileUrl: string;
  fileType: 'IMAGE' | 'VIDEO';
  fileName: string;
  fileSizeMb: number | null;
  width: number | null;
  height: number | null;
  durationSec: number | null;
}

export interface ChatParticipant {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  unreadCount: number;
}

export interface ChatEvent {
  type:
    | 'MESSAGE_SENT'
    | 'MESSAGE_EDITED'
    | 'MESSAGE_DELETED'
    | 'MESSAGE_PINNED'
    | 'MESSAGE_UNPINNED'
    | 'MESSAGE_READ';
  message: ChatMessage | null;
  messageId: string | null;
  readerId?: string | null;
  readAt?: string | null;
}

export interface SendMessageRequest {
  content: string;
}

export interface EditMessageRequest {
  content: string;
}

export interface CreateGroupChatRequest {
  chatName: string;
  chatAvatarUrl: string | null;
  studentIds: string[];
  existingGroupId: string | null;
}

export interface UpdateGroupChatRequest {
  chatName: string;
  chatAvatarUrl: string | null;
}

export interface SearchMessagesRequest {
  query: string;
  page: number;
  pageSize: number;
}

