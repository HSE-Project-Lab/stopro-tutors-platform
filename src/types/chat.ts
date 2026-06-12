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
  studentId: string;
  studentName: string;
  studentAvatarUrl: string | null;
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
  createdAt: string;
  updatedAt: string | null;
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

