/**
 * WebSocket Service for Real-time Notifications
 * Handles WebSocket connections, subscriptions, and real-time event broadcasting
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { NotificationEvent, BidNotificationEvent, OrderNotificationEvent, PaymentNotificationEvent, ChatNotificationEvent, WSEvent, WSMessage } from '../types/notification.types';

interface UserSocket {
  socket: Socket;
  userId: string;
  subscribedChannels: Set<string>;
}

export class WebSocketService {
  private io: SocketIOServer | null = null;
  private redisPublisher: Redis | null = null;
  private redisSubscriber: Redis | null = null;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private socketUsers: Map<string, string> = new Map(); // socketId -> userId
  private channelSubscribers: Map<string, Set<string>> = new Map(); // channel -> socketIds

  constructor() {}

  /**
   * Initialize WebSocket server with Redis adapter for horizontal scaling
   */
  async initialize(server: any, port: number): Promise<void> {
    try {
      // Create Socket.IO server
      this.io = new SocketIOServer(server, {
        cors: {
          origin: process.env.CORS_ORIGIN || '*',
          methods: ['GET', 'POST'],
          credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
      });

      // Initialize Redis adapter for multi-instance support
      if (process.env.REDIS_URL) {
        const redisUrl = new URL(process.env.REDIS_URL);
        this.redisPublisher = new Redis({
          host: redisUrl.hostname,
          port: parseInt(redisUrl.port),
          password: redisUrl.password || undefined,
        });
        this.redisSubscriber = this.redisPublisher.duplicate();

        this.io.adapter(createAdapter(this.redisPublisher, this.redisSubscriber));
        logger.info('WebSocket Redis adapter initialized');
      }

      // Handle connections
      this.io.on('connection', (socket: Socket) => {
        this.handleConnection(socket);
      });

      // Start listening for Redis pub/sub messages
      if (this.redisSubscriber) {
        await this.subscribeToRedisChannels();
      }

      logger.info(`WebSocket server initialized on port ${port}`);
    } catch (error) {
      logger.error('Failed to initialize WebSocket server:', error);
      throw error;
    }
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    const userId = socket.handshake.query.userId as string;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // Store socket mapping
    this.socketUsers.set(socket.id, userId);
    
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    logger.info(`User ${userId} connected with socket ${socket.id}`);

    // Handle authentication
    socket.on('authenticate', (token: string) => {
      // TODO: Validate JWT token
      socket.emit('authenticated', { success: true });
    });

    // Handle channel subscriptions
    socket.on('subscribe', (channels: string[]) => {
      this.subscribeToChannels(socket.id, channels);
    });

    // Handle unsubscriptions
    socket.on('unsubscribe', (channels: string[]) => {
      this.unsubscribeFromChannels(socket.id, channels);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket.id);
    });

    // Handle ping for connection health check
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Send connection confirmation
    socket.emit('connected', { 
      socketId: socket.id,
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Subscribe socket to channels
   */
  private subscribeToChannels(socketId: string, channels: string[]): void {
    const userId = this.socketUsers.get(socketId);
    if (!userId) return;

    channels.forEach(channel => {
      // Add to channel subscribers
      if (!this.channelSubscribers.has(channel)) {
        this.channelSubscribers.set(channel, new Set());
      }
      this.channelSubscribers.get(channel)!.add(socketId);

      // Join socket room
      if (this.io) {
        this.io.sockets.sockets.get(socketId)?.join(channel);
      }
    });

    logger.debug(`Socket ${socketId} subscribed to channels: ${channels.join(', ')}`);
  }

  /**
   * Unsubscribe socket from channels
   */
  private unsubscribeFromChannels(socketId: string, channels: string[]): void {
    channels.forEach(channel => {
      // Remove from channel subscribers
      this.channelSubscribers.get(channel)?.delete(socketId);
      
      // Leave socket room
      if (this.io) {
        this.io.sockets.sockets.get(socketId)?.leave(channel);
      }
    });

    logger.debug(`Socket ${socketId} unsubscribed from channels: ${channels.join(', ')}`);
  }

  /**
   * Handle socket disconnection
   */
  private handleDisconnection(socketId: string): void {
    const userId = this.socketUsers.get(socketId);
    
    if (userId) {
      // Remove from user sockets
      this.userSockets.get(userId)?.delete(socketId);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // Remove from all channel subscriptions
    this.channelSubscribers.forEach((sockets, channel) => {
      sockets.delete(socketId);
    });

    this.socketUsers.delete(socketId);
    logger.info(`Socket ${socketId} disconnected`);
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: string, event: NotificationEvent): Promise<void> {
    if (!this.io) return;

    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) {
      logger.debug(`No active sockets for user ${userId}`);
      return;
    }

    sockets.forEach(socketId => {
      this.io!.to(socketId).emit(event.type, event);
    });

    logger.debug(`Sent ${event.type} event to user ${userId}`);
  }

  /**
   * Broadcast event to all connected sockets
   */
  async broadcast(event: NotificationEvent): Promise<void> {
    if (!this.io) return;

    this.io.emit(event.type, event);
    logger.debug(`Broadcasted ${event.type} event to all users`);
  }

  /**
   * Broadcast event to specific channel
   */
  async broadcastToChannel(channel: string, event: WSEvent): Promise<void> {
    if (!this.io) return;

    this.io.to(channel).emit(event.event, event.payload);
    logger.debug(`Broadcasted ${event.event} to channel ${channel}`);
  }

  /**
   * Send bid notification
   */
  async sendBidNotification(event: BidNotificationEvent): Promise<void> {
    const notificationEvent: NotificationEvent = {
      type: 'bid',
      data: event,
      timestamp: event.timestamp,
    };

    // Send to specific user
    await this.sendToUser(event.userId, notificationEvent);

    // Also broadcast to auction room for real-time updates
    await this.broadcastToChannel(`auction:${event.auctionId}`, {
      event: event.type,
      payload: event,
    });
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(event: OrderNotificationEvent): Promise<void> {
    const notificationEvent: NotificationEvent = {
      type: 'order',
      data: event,
      timestamp: event.timestamp,
    };

    await this.sendToUser(event.orderDetails.userId, notificationEvent);
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(event: PaymentNotificationEvent): Promise<void> {
    const notificationEvent: NotificationEvent = {
      type: 'payment',
      data: event,
      timestamp: event.timestamp,
    };

    await this.sendToUser(event.details.userId, notificationEvent);
  }

  /**
   * Send chat notification
   */
  async sendChatNotification(event: ChatNotificationEvent): Promise<void> {
    const notificationEvent: NotificationEvent = {
      type: 'message',
      data: event,
      timestamp: event.timestamp,
    };

    await this.sendToUser(event.conversationId, notificationEvent);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Get socket count for user
   */
  getUserSocketCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  /**
   * Subscribe to Redis channels for cross-instance communication
   */
  private async subscribeToRedisChannels(): Promise<void> {
    if (!this.redisSubscriber) return;

    const channels = [
      'notification:bid',
      'notification:order',
      'notification:payment',
      'notification:chat',
      'notification:auction',
    ];

    this.redisSubscriber.subscribe(...channels, (err, count) => {
      if (err) {
        logger.error('Failed to subscribe to Redis channels:', err);
        return;
      }
      logger.info(`Subscribed to ${count} Redis channels`);
    });

    this.redisSubscriber.on('message', (channel: string, message: string) => {
      this.handleRedisMessage(channel, message);
    });
  }

  /**
   * Handle incoming Redis pub/sub messages
   */
  private handleRedisMessage(channel: string, message: string): void {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'notification:bid':
          this.sendBidNotification(data);
          break;
        case 'notification:order':
          this.sendOrderNotification(data);
          break;
        case 'notification:payment':
          this.sendPaymentNotification(data);
          break;
        case 'notification:chat':
          this.sendChatNotification(data);
          break;
        case 'notification:auction':
          this.broadcastToChannel(`auction:${data.auctionId}`, {
            event: data.type,
            payload: data,
          });
          break;
      }
    } catch (error) {
      logger.error('Error handling Redis message:', error);
    }
  }

  /**
   * Publish message to Redis channel
   */
  async publishToChannel(channel: string, data: any): Promise<void> {
    if (!this.redisPublisher) return;

    await this.redisPublisher.publish(channel, JSON.stringify(data));
  }

  /**
   * Close WebSocket server
   */
  async close(): Promise<void> {
    if (this.io) {
      await this.io.close();
    }
    if (this.redisPublisher) {
      await this.redisPublisher.quit();
    }
    if (this.redisSubscriber) {
      await this.redisSubscriber.quit();
    }
    logger.info('WebSocket server closed');
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
