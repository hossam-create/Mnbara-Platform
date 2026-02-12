// Chat Entity - Domain Model
// Real-time messaging between users

export type MessageType = 'text' | 'image' | 'file' | 'location' | 'system';

export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  mediaThumbnail?: string;
  latitude?: number;
  longitude?: string;
  status: MessageStatus;
  timestamp: string;
  readBy: string[];
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  deliveryId?: string;
  tripId?: string;
  matchId?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  isMuted: boolean;
}

// Create Message DTO
export interface CreateMessageRequest {
  conversationId: string;
  type: MessageType;
  content: string;
  mediaUrl?: string;
  latitude?: number;
  longitude?: number;
}

// Create Conversation DTO
export interface CreateConversationRequest {
  participantId: string;
  deliveryId?: string;
  tripId?: string;
  matchId?: string;
  initialMessage?: string;
}

// Chat State
export interface ChatState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Record<string, Message[]>;
  onlineUsers: string[];
  typingUsers: Record<string, string[]>;
  loading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

// Socket Events
export type SocketEvent =
  | 'connect'
  | 'disconnect'
  | 'message.new'
  | 'message.read'
  | 'typing.start'
  | 'typing.stop'
  | 'user.online'
  | 'user.offline';

export interface SocketEventPayload {
  'message.new': Message;
  'message.read': { messageId: string; conversationId: string; userId: string };
  'typing.start': { conversationId: string; userId: string; userName: string };
  'typing.stop': { conversationId: string; userId: string };
  'user.online': { userId: string };
  'user.offline': { userId: string };
}
