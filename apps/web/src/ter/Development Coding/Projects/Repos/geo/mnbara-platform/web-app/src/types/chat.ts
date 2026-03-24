/**
 * Chat Types for Mnbara Platform
 * Comprehensive type definitions for chat, messaging, and conversations
 */

// User Types for Chat
export interface ChatUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  onlineStatus: OnlineStatus;
  lastSeenAt?: string;
  role: 'buyer' | 'seller' | 'admin';
  trustScore?: number;
  verified?: boolean;
}

export type OnlineStatus = 'online' | 'offline' | 'away' | 'busy' | 'invisible';

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: MessageContent;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;
  editedAt?: string;
  readBy?: ReadReceipt[];
  replyTo?: string;
  reactions?: MessageReaction[];
}

export type MessageType = 'text' | 'image' | 'file' | 'system' | 'offer' | 'inquiry';

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  siteName?: string;
  faviconUrl?: string;
}

export interface MessageContent {
  text?: string;
  attachments?: Attachment[];
  preview?: LinkPreview;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'audio' | 'video';
  url: string;
  filename?: string;
  mimeType: string;
  size: number;
  thumbnailUrl?: string;
  duration?: number; // for audio/video
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  count: number;
  users?: string[];
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface ReadReceipt {
  userId: string;
  readAt: string;
}

// Conversation Types
export interface Conversation {
  id: string;
  participants: ChatUser[];
  type: ConversationType;
  title?: string;
  avatarUrl?: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  isBlocked: boolean;
  createdAt: string;
  updatedAt: string;
  orderId?: string; // Linked order for e-commerce context
  productId?: string; // Linked product
}

export type ConversationType = 'direct' | 'group' | 'order' | 'support';

// Conversation List Item (for display)
export interface ConversationListItem {
  conversation: Conversation;
  otherParticipant?: ChatUser;
  preview: string;
  timestamp: string;
  hasUnread: boolean;
  unreadCount: number;
  isOnline?: boolean;
}

// Chat Input Types
export interface ChatInputState {
  text: string;
  attachments: Attachment[];
  isTyping: boolean;
  replyTo?: string;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

// Search and Filter Types
export interface ConversationSearchFilters {
  query?: string;
  hasUnread?: boolean;
  isArchived?: boolean;
  type?: ConversationType;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ConversationSortOptions {
  field: 'lastMessageAt' | 'unreadCount' | 'createdAt';
  order: 'asc' | 'desc';
}

// Chat Actions
export interface ConversationAction {
  id: string;
  type: 'block' | 'report' | 'archive' | 'unarchive' | 'pin' | 'unpin' | 'delete' | 'leave';
  label: string;
  icon: string;
  confirmRequired?: boolean;
  destructive?: boolean;
}

// System Messages
export interface SystemMessage {
  id: string;
  conversationId: string;
  type: SystemMessageType;
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export type SystemMessageType = 
  | 'user_joined'
  | 'user_left'
  | 'order_created'
  | 'order_confirmed'
  | 'order_shipped'
  | 'order_delivered'
  | 'payment_received'
  | 'dispute_opened'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected';

// Chat Events (for real-time)
export interface ChatEvent {
  type: ChatEventType;
  conversationId: string;
  userId: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export type ChatEventType = 
  | 'message_sent'
  | 'message_delivered'
  | 'message_read'
  | 'typing_started'
  | 'typing_stopped'
  | 'user_online'
  | 'user_offline'
  | 'conversation_updated'
  | 'participant_added'
  | 'participant_removed';

// Pagination
export interface PaginatedConversations {
  conversations: ConversationListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginatedMessages {
  messages: Message[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
