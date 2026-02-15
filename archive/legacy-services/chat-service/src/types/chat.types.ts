export interface CreateConversationDto {
  type: 'DIRECT' | 'GROUP' | 'CHANNEL';
  name?: string;
  avatar?: string;
  participantIds: string[];
  createdBy: string;
}

export interface SendMessageDto {
  conversationId: string;
  senderId: string;
  content: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO';
  metadata?: Record<string, any>;
  replyToId?: string;
}

export interface EditMessageDto {
  messageId: string;
  content: string;
  userId: string;
}

export interface DeleteMessageDto {
  messageId: string;
  userId: string;
}

export interface AddReactionDto {
  messageId: string;
  userId: string;
  emoji: string;
}

export interface MarkAsReadDto {
  conversationId: string;
  userId: string;
  messageId: string;
}

export interface TypingDto {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface SocketUser {
  userId: string;
  socketId: string;
}

export interface ChatEvent {
  event: string;
  data: any;
  conversationId?: string;
  userId?: string;
}
