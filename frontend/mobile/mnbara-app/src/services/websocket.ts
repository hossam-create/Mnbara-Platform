/**
 * WebSocket Service for MNBARA Mobile App
 * Handles real-time auction updates, notifications, and bidding
 */

import { getAccessToken } from './secureStorage';

// WebSocket Configuration
const WS_BASE_URL = __DEV__
  ? 'ws://localhost:8080/ws'
  : 'wss://api.mnbara.com/ws';

// Event types
export type AuctionEventType =
  | 'auction:state'
  | 'auction:bid_placed'
  | 'auction:bid_rejected'
  | 'auction:ending_soon'
  | 'auction:ended'
  | 'auction:outbid'
  | 'auction:time_sync';

export interface AuctionState {
  auctionId: string;
  currentPrice: number;
  totalBids: number;
  highestBidder?: { id: string; name: string };
  endTime: string;
  status: string;
}

export interface BidPlacedEvent {
  auctionId: string;
  bid: {
    id: string;
    bidderId: string;
    bidder: { id: string; name: string; rating: number };
    amount: number;
    isProxy: boolean;
    createdAt: string;
  };
  newHighest: number;
  totalBids: number;
}

export interface BidRejectedEvent {
  auctionId: string;
  reason: string;
}

export interface AuctionEndingSoonEvent {
  auctionId: string;
  secondsRemaining: number;
}

export interface AuctionEndedEvent {
  auctionId: string;
  winner?: { id: string; name: string };
  finalPrice: number;
}

export interface OutbidEvent {
  auctionId: string;
  newHighest: number;
  outbidBy: { id: string; name: string };
}

type EventCallback = (data: unknown) => void;
type EventSubscriptions = Map<string, Set<EventCallback>>;

class WebSocketService {
  private ws: WebSocket | null = null;
  private subscriptions: EventSubscriptions = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private subscribedAuctions: Set<string> = new Set();
  private connectionPromise: Promise<void> | null = null;

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = this._connect();
    
    try {
      await this.connectionPromise;
    } finally {
      this.isConnecting = false;
      this.connectionPromise = null;
    }
  }

  private async _connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const token = await getAccessToken();
        const url = token ? `${WS_BASE_URL}?token=${token}` : WS_BASE_URL;

        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          
          // Re-subscribe to previously subscribed auctions
          this.subscribedAuctions.forEach(auctionId => {
            this.send('auction:subscribe', { auctionId });
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            const { type, data } = message;
            this.emit(type, data);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected:', event.code, event.reason);
          this.ws = null;
          
          // Attempt reconnection if not intentionally closed
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        // Timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.subscribedAuctions.clear();
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
  }

  send(type: string, data: unknown): void {
    if (!this.isConnected) {
      console.warn('[WebSocket] Not connected, cannot send message');
      return;
    }

    const message = JSON.stringify({ type, data });
    this.ws?.send(message);
  }

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    this.subscriptions.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    const callbacks = this.subscriptions.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error in callback for ${event}:`, error);
        }
      });
    }
  }

  // Auction-specific methods
  subscribeToAuction(auctionId: string): void {
    this.subscribedAuctions.add(auctionId);
    if (this.isConnected) {
      this.send('auction:subscribe', { auctionId });
    }
  }

  unsubscribeFromAuction(auctionId: string): void {
    this.subscribedAuctions.delete(auctionId);
    if (this.isConnected) {
      this.send('auction:unsubscribe', { auctionId });
    }
  }

  placeBid(auctionId: string, amount: number): void {
    this.send('auction:bid', { auctionId, amount });
  }

  setProxyBid(auctionId: string, maxAmount: number): void {
    this.send('auction:proxy_bid', { auctionId, maxAmount });
  }
}

// Singleton instance
export const wsService = new WebSocketService();

// Auction event helpers
export const auctionEvents = {
  onState: (callback: (data: AuctionState) => void) => 
    wsService.subscribe('auction:state', callback as EventCallback),
  
  onBidPlaced: (callback: (data: BidPlacedEvent) => void) => 
    wsService.subscribe('auction:bid_placed', callback as EventCallback),
  
  onBidRejected: (callback: (data: BidRejectedEvent) => void) => 
    wsService.subscribe('auction:bid_rejected', callback as EventCallback),
  
  onEndingSoon: (callback: (data: AuctionEndingSoonEvent) => void) => 
    wsService.subscribe('auction:ending_soon', callback as EventCallback),
  
  onEnded: (callback: (data: AuctionEndedEvent) => void) => 
    wsService.subscribe('auction:ended', callback as EventCallback),
  
  onOutbid: (callback: (data: OutbidEvent) => void) => 
    wsService.subscribe('auction:outbid', callback as EventCallback),
};

export default wsService;
