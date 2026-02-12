import { apiClient } from './client';
import { Conversation, Message, MessageType } from '../../domain/entities/chat.entity';

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType: MessageType;
  attachments?: Array<{
    type: 'image' | 'file' | 'location';
    url: string;
    metadata?: Record<string, any>;
  }>;
}

export interface CreateConversationRequest {
  participantId: string;
  initialMessage?: string;
  contextType: 'delivery' | 'trip' | 'dispute' | 'general';
  contextId?: string;
}

export interface ConversationFilters {
  page?: number;
  limit?: number;
  includeArchived?: boolean;
}

class ChatApiService {
  private static instance: ChatApiService;

  public static getInstance(): ChatApiService {
    if (!ChatApiService.instance) {
      ChatApiService.instance = new ChatApiService();
    }
    return ChatApiService.instance;
  }

  async getConversations(filters?: ConversationFilters): Promise<{
    conversations: Conversation[];
    total: number;
    hasMore: boolean;
  }> {
    let url = '/api/chat/conversations';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.includeArchived) params.append('includeArchived', 'true');
      url += `?${params.toString()}`;
    }
    const response = await apiClient.get<{
      conversations: Conversation[];
      total: number;
      hasMore: boolean;
    }>(url);
    return response;
  }

  async getConversationById(conversationId: string): Promise<Conversation> {
    const response = await apiClient.get<Conversation>(`/api/chat/conversations/${conversationId}`);
    return response;
  }

  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/api/chat/conversations', data);
    return response;
  }

  async archiveConversation(conversationId: string): Promise<void> {
    await apiClient.post(`/api/chat/conversations/${conversationId}/archive`);
  }

  async unarchiveConversation(conversationId: string): Promise<void> {
    await apiClient.post(`/api/chat/conversations/${conversationId}/unarchive`);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await apiClient.delete(`/api/chat/conversations/${conversationId}`);
  }

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<{
    messages: Message[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await apiClient.get<{
      messages: Message[];
      total: number;
      hasMore: boolean;
    }>(
      `/api/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
    );
    return response;
  }

  async sendMessage(data: SendMessageRequest): Promise<Message> {
    const response = await apiClient.post<Message>(
      `/api/chat/conversations/${data.conversationId}/messages`,
      {
        content: data.content,
        messageType: data.messageType,
        attachments: data.attachments,
      }
    );
    return response;
  }

  async markMessageAsRead(conversationId: string, messageId: string): Promise<void> {
    await apiClient.post(
      `/api/chat/conversations/${conversationId}/messages/${messageId}/read`
    );
  }

  async markAllMessagesAsRead(conversationId: string): Promise<void> {
    await apiClient.post(`/api/chat/conversations/${conversationId}/read-all`);
  }

  async getUnreadCount(): Promise<{ totalUnread: number; byConversation: Record<string, number> }> {
    const response = await apiClient.get<{
      totalUnread: number;
      byConversation: Record<string, number>;
    }>('/api/chat/unread-count');
    return response;
  }

  async uploadAttachment(
    conversationId: string,
    file: { uri: string; name: string; type: string }
  ): Promise<{ url: string; type: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    
    const response = await apiClient.post<{ url: string; type: string }>(
      `/api/chat/conversations/${conversationId}/attachments`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response;
  }
}

export const chatApi = ChatApiService.getInstance();
