/**
 * WebSocket Activity Server
 * 
 * Handles real-time activity streaming via WebSocket connections.
 * Features:
 * - JWT authentication on connection
 * - Per-user socket mapping with Redis
 * - Heartbeat mechanism for connection health
 * - Rate limiting per user (max 2 connections)
 * - Horizontal scaling ready (Redis-based)
 */

import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { redisPresenceManager } from './redis-presence.manager';
import {
  ActivityEventPayload,
  WebSocketMessage,
  WebSocketClientMetadata,
  HeartbeatMessage,
  ActivityWebSocketEvent,
} from './activity-event.types';

// Active connections map (local to this instance)
// For horizontal scaling, we use Redis for cross-instance communication
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  socketId: string;
  isAlive: boolean;
  metadata?: WebSocketClientMetadata;
}

interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

export class ActivityWebSocketServer {
  private wss: WebSocketServer | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private readonly HEARTBEAT_TIMEOUT = 60000; // 60 seconds
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private readonly MAX_CONNECTIONS_PER_USER = 2;

  // Local socket registry for this instance
  private localSockets: Map<string, AuthenticatedWebSocket> = new Map();

  /**
   * Initialize WebSocket server attached to HTTP server
   */
  initialize(server: HttpServer): void {
    this.wss = new WebSocketServer({
      server,
      path: '/ws/activity',
      verifyClient: this.verifyClient.bind(this),
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));

    // Start heartbeat checking
    this.startHeartbeat();

    console.log('[WebSocket] Activity server initialized on /ws/activity');
  }

  /**
   * Verify client during handshake - JWT authentication
   */
  private verifyClient(info: { req: any }): boolean {
    try {
      const url = new URL(info.req.url, `http://${info.req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        console.warn('[WebSocket] Connection rejected: No token provided');
        return false;
      }

      // Verify JWT
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        // Attach user info to request for later use
        info.req.userId = decoded.sub;
        return true;
      } catch {
        console.warn('[WebSocket] Connection rejected: Invalid token');
        return false;
      }
    } catch (error) {
      console.error('[WebSocket] Verification error:', error);
      return false;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: AuthenticatedWebSocket, req: any): Promise<void> {
    const userId = req.userId as string;
    const socketId = `sock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const clientIp = req.socket?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';

    ws.socketId = socketId;
    ws.isAlive = true;
    ws.userId = userId;

    // Check connection limit per user
    const existingConnections = await this.getUserConnectionCount(userId);
    if (existingConnections >= this.MAX_CONNECTIONS_PER_USER) {
      console.warn(`[WebSocket] User ${userId} exceeded max connections (${this.MAX_CONNECTIONS_PER_USER})`);
      ws.close(1008, 'Maximum connections exceeded');
      return;
    }

    // Register socket metadata
    ws.metadata = {
      userId,
      socketId,
      connectedAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      ip: clientIp,
      userAgent: req.headers['user-agent'],
    };

    // Store locally and in Redis
    this.localSockets.set(socketId, ws);
    await redisPresenceManager.registerSocket(userId, socketId);

    console.log(`[WebSocket] User ${userId} connected (socket: ${socketId}, total: ${existingConnections + 1})`);

    // Send connection established event
    this.sendToSocket(ws, {
      type: 'connection:established',
      payload: {
        socketId,
        userId,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    // Setup event handlers
    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('pong', () => this.handlePong(ws));
    ws.on('close', () => this.handleClose(ws));
    ws.on('error', (error) => this.handleSocketError(ws, error));
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(ws: AuthenticatedWebSocket, data: WebSocket.RawData): void {
    try {
      const message = JSON.parse(data.toString()) as WebSocketMessage<unknown>;

      switch (message.type) {
        case 'heartbeat':
          this.handleHeartbeat(ws);
          break;
        default:
          console.log(`[WebSocket] Received unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
      this.sendToSocket(ws, {
        type: 'connection:error',
        payload: { message: 'Invalid message format' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle heartbeat from client
   */
  private async handleHeartbeat(ws: AuthenticatedWebSocket): Promise<void> {
    ws.isAlive = true;
    if (ws.metadata) {
      ws.metadata.lastHeartbeat = new Date().toISOString();
    }

    // Refresh Redis presence TTL
    if (ws.userId) {
      await redisPresenceManager.refreshHeartbeat(ws.userId, ws.socketId);
    }

    // Acknowledge heartbeat
    const heartbeat: HeartbeatMessage = {
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
    };

    this.sendToSocket(ws, {
      type: 'heartbeat',
      payload: heartbeat,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle pong response from client
   */
  private handlePong(ws: AuthenticatedWebSocket): void {
    ws.isAlive = true;
    if (ws.metadata) {
      ws.metadata.lastHeartbeat = new Date().toISOString();
    }
  }

  /**
   * Handle socket close
   */
  private async handleClose(ws: AuthenticatedWebSocket): Promise<void> {
    const { userId, socketId } = ws;

    if (userId && socketId) {
      this.localSockets.delete(socketId);
      await redisPresenceManager.unregisterSocket(userId, socketId);
      console.log(`[WebSocket] User ${userId} disconnected (socket: ${socketId})`);
    }
  }

  /**
   * Handle socket error
   */
  private handleSocketError(ws: AuthenticatedWebSocket, error: Error): void {
    console.error(`[WebSocket] Socket error for ${ws.userId}:`, error.message);
  }

  /**
   * Handle server-level error
   */
  private handleServerError(error: Error): void {
    console.error('[WebSocket] Server error:', error);
  }

  /**
   * Start heartbeat checking interval
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkConnections();
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Check all connections and terminate dead ones
   */
  private async checkConnections(): Promise<void> {
    for (const [socketId, ws] of this.localSockets) {
      if (!ws.isAlive) {
        console.log(`[WebSocket] Terminating dead connection: ${socketId}`);
        ws.terminate();
        if (ws.userId) {
          await redisPresenceManager.unregisterSocket(ws.userId, socketId);
        }
        this.localSockets.delete(socketId);
        continue;
      }

      ws.isAlive = false;
      ws.ping();
    }
  }

  /**
   * Send activity event to specific user (called by Kafka consumer)
   */
  async sendActivityToUser(userId: string, activity: ActivityEventPayload): Promise<void> {
    // Get all socket IDs for this user from Redis
    const socketIds = await redisPresenceManager.getUserSockets(userId);

    if (socketIds.length === 0) {
      // User not connected, event will be fetched via REST
      return;
    }

    const event: ActivityWebSocketEvent = {
      type: 'activity:new',
      payload: activity,
      timestamp: new Date().toISOString(),
    };

    // Send to all user's sockets
    for (const socketId of socketIds) {
      const ws = this.localSockets.get(socketId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendToSocket(ws, event);
      }
    }

    console.log(`[WebSocket] Sent activity to user ${userId} (${socketIds.length} sockets)`);
  }

  /**
   * Send message to specific socket
   */
  private sendToSocket<T>(ws: AuthenticatedWebSocket, message: WebSocketMessage<T> | ActivityWebSocketEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[WebSocket] Failed to send message:', error);
      }
    }
  }

  /**
   * Get number of active connections for a user
   */
  private async getUserConnectionCount(userId: string): Promise<number> {
    const sockets = await redisPresenceManager.getUserSockets(userId);
    return sockets.length;
  }

  /**
   * Get server statistics
   */
  getStats(): { localConnections: number; totalInstances: number } {
    return {
      localConnections: this.localSockets.size,
      totalInstances: 1, // Will be enhanced with Redis pub/sub for cross-instance stats
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[WebSocket] Shutting down...');

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // Close all connections
    for (const [socketId, ws] of this.localSockets) {
      if (ws.userId) {
        await redisPresenceManager.unregisterSocket(ws.userId, socketId);
      }
      ws.close(1001, 'Server shutting down');
    }

    this.localSockets.clear();

    return new Promise((resolve) => {
      this.wss?.close(() => {
        console.log('[WebSocket] Server closed');
        resolve();
      });
    });
  }
}

// Export singleton
export const activityWebSocketServer = new ActivityWebSocketServer();
export default activityWebSocketServer;
