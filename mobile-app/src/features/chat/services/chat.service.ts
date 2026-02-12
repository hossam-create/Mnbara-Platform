// Chat Service - Socket.IO Integration
import { io, Socket } from 'socket.io-client';
import { Message, Conversation, CreateMessageRequest } from '../../domain/entities/chat.entity';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'wss://api.mnbara.com';

type ChatEventCallback = (data: any) => void;

class ChatService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<ChatEventCallback>> = new Map();
  private currentUserId: string = '';

  connect(userId: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentUserId = userId;
      
      this.socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Chat connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Chat connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Chat disconnected:', reason);
      });

      // Set up event forwarding
      this.socket.onAny((event, data) => {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
          callbacks.forEach((callback) => callback(data));
        }
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  subscribe(event: string, callback: ChatEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('conversations.get', {}, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      });
    });
  }

  async getMessages(conversationId: string, page = 1, limit = 50): Promise<Message[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit(
        'messages.get',
        { conversationId, page, limit },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.data);
          }
        }
      );
    });
  }

  async sendMessage(request: CreateMessageRequest): Promise<Message> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('message.send', request, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.data);
        }
      });
    });
  }

  async markAsRead(conversationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit('messages.read', { conversationId }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  startTyping(conversationId: string): void {
    this.socket?.emit('typing.start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit('typing.stop', { conversationId });
  }

  // Create new conversation
  async createConversation(
    participantId: string,
    deliveryId?: string,
    tripId?: string,
    initialMessage?: string
  ): Promise<Conversation> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit(
        'conversation.create',
        { participantId, deliveryId, tripId, initialMessage },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.data);
          }
        }
      );
    });
  }

  // Archive conversation
  async archiveConversation(conversationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit(
        'conversation.archive',
        { conversationId },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Not connected'));
        return;
      }

      this.socket.emit(
        'conversation.delete',
        { conversationId },
        (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve();
          }
        }
      );
    });
  }
}

export const chatService = new ChatService();
