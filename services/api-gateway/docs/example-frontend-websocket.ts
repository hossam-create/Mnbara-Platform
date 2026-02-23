/**
 * Frontend WebSocket Connection Example
 * 
 * This is a reference implementation for the React frontend
 * showing how to connect to the real-time activity stream.
 * 
 * Use this pattern in the frontend React app.
 */

import { useEffect, useRef, useCallback } from 'react';

// Types matching the backend WebSocket contract
type ActivityDomain = 'wallet' | 'traveler' | 'marketplace';

type ActivityStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

interface ActivityEvent {
  eventId: string;
  userId: string;
  domain: ActivityDomain;
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
  currency?: string;
  status?: ActivityStatus;
  metadata?: Record<string, unknown>;
}

interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: string;
}

interface UseActivityWebSocketOptions {
  token: string;
  onActivity: (activity: ActivityEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * React Hook: useActivityWebSocket
 * 
 * Example usage:
 * ```tsx
 * function ActivityPage() {
 *   const { isConnected, error } = useActivityWebSocket({
 *     token: authToken,
 *     onActivity: (activity) => {
 *       // Add to React Query cache or state
 *       queryClient.invalidateQueries({ queryKey: ['activity'] });
 *       // Or: add to local state
 *       setActivities(prev => [activity, ...prev]);
 *     },
 *   });
 * 
 *   return <div>{isConnected ? '🟢 Live' : '🔴 Offline'}</div>;
 * }
 * ```
 */
export function useActivityWebSocket(options: UseActivityWebSocketOptions) {
  const {
    token,
    onActivity,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:3000'}/ws/activity?token=${encodeURIComponent(token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();

        // Start heartbeat
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
          }
        }, 30000); // Every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage<unknown>;

          switch (message.type) {
            case 'activity:new':
              onActivity(message.payload as ActivityEvent);
              break;
            case 'connection:established':
              console.log('[WebSocket] Connection established:', message.payload);
              break;
            case 'connection:error':
              console.error('[WebSocket] Connection error:', message.payload);
              onError?.(new Error(String(message.payload)));
              break;
            case 'heartbeat':
              // Heartbeat acknowledged
              break;
            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        onDisconnect?.();

        // Clear heartbeat
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`[WebSocket] Reconnecting... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          setTimeout(connect, reconnectInterval);
        } else {
          console.error('[WebSocket] Max reconnection attempts reached');
          onError?.(new Error('Max reconnection attempts reached'));
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        onError?.(new Error('WebSocket error'));
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
      onError?.(error instanceof Error ? error : new Error('Connection failed'));
    }
  }, [token, onActivity, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting');
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
  };
}

/**
 * Alternative: Simple WebSocket Service (non-React)
 * 
 * For vanilla JS or non-React frameworks
 */
export class ActivityWebSocketService {
  private ws: WebSocket | null = null;
  private token: string;
  private url: string;
  private reconnectInterval: number;
  private maxReconnectAttempts: number;
  private reconnectAttempts = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor(
    token: string,
    url = 'ws://localhost:3000/ws/activity',
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  ) {
    this.token = token;
    this.url = url;
    this.reconnectInterval = reconnectInterval;
    this.maxReconnectAttempts = maxReconnectAttempts;
  }

  connect(): void {
    const wsUrl = `${this.url}?token=${encodeURIComponent(this.token)}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('[ActivityWebSocket] Connected');
      this.reconnectAttempts = 0;
      this.emit('connect', null);
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit(message.type, message.payload);
      } catch (error) {
        console.error('[ActivityWebSocket] Failed to parse message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('[ActivityWebSocket] Disconnected');
      this.emit('disconnect', null);
      this.stopHeartbeat();
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('[ActivityWebSocket] Error:', error);
      this.emit('error', error);
    };
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[ActivityWebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Example usage:
/*
import { ActivityWebSocketService } from './activity-websocket.service';

const ws = new ActivityWebSocketService(authToken);

ws.on('activity:new', (activity) => {
  console.log('New activity:', activity);
  // Update UI, invalidate cache, etc.
});

ws.on('connect', () => {
  console.log('Connected to real-time activity stream');
});

ws.on('disconnect', () => {
  console.log('Disconnected from activity stream');
});

ws.connect();

// Later:
// ws.disconnect();
*/
