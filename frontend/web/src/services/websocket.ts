// ============================================
// 🔌 WebSocket Service - Real-time Communication
// ============================================

type MessageHandler = (data: unknown) => void;
type ConnectionHandler = () => void;

interface WebSocketMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private disconnectionHandlers: Set<ConnectionHandler> = new Set();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  private baseUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(`${this.baseUrl}?token=${token}`);

        this.socket.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.reconnectAttempts = 0;
          this.startPing();
          this.connectionHandlers.forEach(handler => handler());
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('🔌 WebSocket disconnected', event.code, event.reason);
          this.stopPing();
          this.disconnectionHandlers.forEach(handler => handler());
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(token);
          }
        };

        this.socket.onerror = (error) => {
          console.error('🔌 WebSocket error:', error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(token: string): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔌 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect(token).catch(console.error);
    }, delay);
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send('ping', {});
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.payload));
    }

    // Also notify 'all' handlers
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(message));
    }
  }

  send(type: string, payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type,
        payload,
        timestamp: new Date().toISOString(),
      }));
    } else {
      console.warn('WebSocket not connected, message not sent:', type);
    }
  }

  subscribe<T = unknown>(type: string, handler: (data: T) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    const wrappedHandler: MessageHandler = (payload) => {
      handler(payload as T);
    };

    this.messageHandlers.get(type)!.add(wrappedHandler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(wrappedHandler);
    };
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectionHandlers.add(handler);
    return () => this.disconnectionHandlers.delete(handler);
  }

  disconnect(): void {
    this.stopPing();
    if (this.socket) {
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// ============================================
// 🎯 Typed Event Emitters
// ============================================

// Chat Events
export const chatEvents = {
  sendMessage: (conversationId: string, content: string, type = 'text') => {
    wsService.send('chat:message', { conversationId, content, type });
  },
  
  typing: (conversationId: string) => {
    wsService.send('chat:typing', { conversationId });
  },
  
  markRead: (conversationId: string) => {
    wsService.send('chat:read', { conversationId });
  },
  
  onMessage: (handler: (data: { conversationId: string; message: unknown }) => void) => {
    return wsService.subscribe('chat:message', handler);
  },
  
  onTyping: (handler: (data: { conversationId: string; userId: string }) => void) => {
    return wsService.subscribe('chat:typing', handler);
  },
  
  onOnlineStatus: (handler: (data: { userId: string; isOnline: boolean }) => void) => {
    return wsService.subscribe('user:status', handler);
  },
};

// Auction Events
export const auctionEvents = {
  placeBid: (auctionId: string, amount: number) => {
    wsService.send('auction:bid', { auctionId, amount });
  },
  
  watchAuction: (auctionId: string) => {
    wsService.send('auction:watch', { auctionId });
  },
  
  onNewBid: (handler: (data: { auctionId: string; bid: unknown }) => void) => {
    return wsService.subscribe('auction:bid', handler);
  },
  
  onAuctionEnd: (handler: (data: { auctionId: string; winner: unknown }) => void) => {
    return wsService.subscribe('auction:end', handler);
  },
};

// Order Events
export const orderEvents = {
  onStatusUpdate: (handler: (data: { orderId: string; status: string }) => void) => {
    return wsService.subscribe('order:status', handler);
  },
  
  onLocationUpdate: (handler: (data: { orderId: string; location: unknown }) => void) => {
    return wsService.subscribe('order:location', handler);
  },
};

// Notification Events
export const notificationEvents = {
  onNotification: (handler: (data: unknown) => void) => {
    return wsService.subscribe('notification', handler);
  },
};

export default wsService;
