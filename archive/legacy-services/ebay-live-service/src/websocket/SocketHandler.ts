// WebSocket Handler

import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { ChatManager } from '../chat/ChatManager';
import { LiveAuctionManager } from '../auction/LiveAuctionManager';
import { AnalyticsManager } from '../analytics/AnalyticsManager';
import { logger } from '../utils/logger';

export class SocketHandler {
  private io: SocketIOServer;
  private prisma: PrismaClient;
  private redis: Redis;
  private chatManager: ChatManager;
  private auctionManager: LiveAuctionManager;
  private analyticsManager: AnalyticsManager;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(io: SocketIOServer, prisma: PrismaClient, redis: Redis) {
    this.io = io;
    this.prisma = prisma;
    this.redis = redis;
    this.chatManager = new ChatManager(prisma, redis, logger);
    this.auctionManager = new LiveAuctionManager(prisma, logger);
    this.analyticsManager = new AnalyticsManager(prisma, redis, logger);
  }

  initialize() {
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupPeriodicTasks();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
        const user = await this.prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true
          }
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        logger.error('Socket authentication error', error);
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.data.user.name} (${socket.data.user.id})`);

      // Track connection
      this.addUserConnection(socket.data.user.id, socket.id);

      // Join room handlers
      socket.on('joinStream', async (data) => {
        await this.handleJoinStream(socket, data);
      });

      socket.on('leaveStream', async (data) => {
        await this.handleLeaveStream(socket, data);
      });

      // Chat handlers
      socket.on('sendMessage', async (data) => {
        await this.handleSendMessage(socket, data);
      });

      socket.on('deleteMessage', async (data) => {
        await this.handleDeleteMessage(socket, data);
      });

      socket.on('pinMessage', async (data) => {
        await this.handlePinMessage(socket, data);
      });

      // Auction handlers
      socket.on('placeBid', async (data) => {
        await this.handlePlaceBid(socket, data);
      });

      socket.on('joinAuction', async (data) => {
        await this.handleJoinAuction(socket, data);
      });

      socket.on('leaveAuction', async (data) => {
        await this.handleLeaveAuction(socket, data);
      });

      // Stream interaction handlers
      socket.on('heartbeat', async (data) => {
        await this.handleHeartbeat(socket, data);
      });

      socket.on('viewerInteraction', async (data) => {
        await this.handleViewerInteraction(socket, data);
      });

      // Disconnection handler
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinStream(socket: any, data: any) {
    try {
      const { streamId } = data;
      const user = socket.data.user;

      // Verify stream exists
      const stream = await this.prisma.liveStream.findUnique({
        where: { id: streamId },
        select: { id: true, title: true, status: true, sellerId: true }
      });

      if (!stream) {
        socket.emit('error', { message: 'Stream not found' });
        return;
      }

      // Join the stream room
      socket.join(`stream:${streamId}`);
      
      // Track viewer join
      await this.analyticsManager.trackViewerEvent({
        streamId,
        userId: user.id,
        eventType: 'join',
        timestamp: new Date(),
        metadata: {
          socketId: socket.id,
          userAgent: socket.handshake.headers['user-agent']
        }
      });

      // Update viewer count
      const viewerCount = await this.getStreamViewerCount(streamId);
      
      // Notify others in the stream
      socket.to(`stream:${streamId}`).emit('userJoined', {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: user.role
        },
        viewerCount
      });

      // Send current viewer count to the joining user
      socket.emit('viewerCount', { count: viewerCount });

      logger.info(`User ${user.name} joined stream ${streamId}`);
    } catch (error) {
      logger.error('Error handling joinStream', error);
      socket.emit('error', { message: 'Failed to join stream' });
    }
  }

  private async handleLeaveStream(socket: any, data: any) {
    try {
      const { streamId } = data;
      const user = socket.data.user;

      // Leave the stream room
      socket.leave(`stream:${streamId}`);

      // Track viewer leave
      await this.analyticsManager.trackViewerEvent({
        streamId,
        userId: user.id,
        eventType: 'leave',
        timestamp: new Date()
      });

      // Update viewer count
      const viewerCount = await this.getStreamViewerCount(streamId);

      // Notify others in the stream
      socket.to(`stream:${streamId}`).emit('userLeft', {
        user: {
          id: user.id,
          name: user.name
        },
        viewerCount
      });

      logger.info(`User ${user.name} left stream ${streamId}`);
    } catch (error) {
      logger.error('Error handling leaveStream', error);
      socket.emit('error', { message: 'Failed to leave stream' });
    }
  }

  private async handleSendMessage(socket: any, data: any) {
    try {
      const { streamId, content, messageType = 'text', metadata } = data;
      const user = socket.data.user;

      // Check if user is muted
      const isMuted = await this.chatManager.isUserMuted(streamId, user.id);
      if (isMuted) {
        socket.emit('error', { message: 'You are muted in this stream' });
        return;
      }

      const message = await this.chatManager.sendMessage({
        streamId,
        userId: user.id,
        userName: user.name,
        content,
        messageType,
        metadata
      });

      // Broadcast message to all users in the stream
      this.io.to(`stream:${streamId}`).emit('newMessage', {
        message: {
          id: message.id,
          content: message.content,
          messageType: message.messageType,
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            role: user.role
          },
          createdAt: message.createdAt,
          isPinned: message.isPinned
        }
      });

      logger.info(`Message sent in stream ${streamId} by ${user.name}`);
    } catch (error) {
      logger.error('Error handling sendMessage', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleDeleteMessage(socket: any, data: any) {
    try {
      const { messageId } = data;
      const user = socket.data.user;
      const isModerator = user.role === 'moderator' || user.role === 'admin';

      const message = await this.chatManager.deleteMessage(messageId, user.id, isModerator);

      // Broadcast deletion to all users in the stream
      this.io.to(`stream:${message.streamId}`).emit('messageDeleted', {
        messageId,
        deletedBy: user.id
      });

      logger.info(`Message ${messageId} deleted by ${user.name}`);
    } catch (error) {
      logger.error('Error handling deleteMessage', error);
      socket.emit('error', { message: 'Failed to delete message' });
    }
  }

  private async handlePinMessage(socket: any, data: any) {
    try {
      const { messageId } = data;
      const user = socket.data.user;

      const message = await this.chatManager.pinMessage(messageId, user.id);

      // Broadcast pin status to all users in the stream
      this.io.to(`stream:${message.streamId}`).emit('messagePinned', {
        message: {
          id: message.id,
          content: message.content,
          user: {
            id: message.userId,
            name: message.user.name
          },
          pinnedAt: message.pinnedAt
        }
      });

      logger.info(`Message ${messageId} pinned by ${user.name}`);
    } catch (error) {
      logger.error('Error handling pinMessage', error);
      socket.emit('error', { message: 'Failed to pin message' });
    }
  }

  private async handlePlaceBid(socket: any, data: any) {
    try {
      const { auctionId, amount } = data;
      const user = socket.data.user;

      const bid = await this.auctionManager.placeBid({
        auctionId,
        amount,
        userId: user.id,
        userName: user.name
      });

      // Broadcast bid to all users in the auction room
      this.io.to(`auction:${auctionId}`).emit('newBid', {
        bid: {
          id: bid.id,
          amount: bid.amount,
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar
          },
          createdAt: bid.createdAt
        },
        auction: {
          id: auctionId,
          currentPrice: bid.amount,
          highestBidderId: user.id
        }
      });

      logger.info(`Bid placed in auction ${auctionId} by ${user.name}: $${amount}`);
    } catch (error) {
      logger.error('Error handling placeBid', error);
      socket.emit('error', { message: error.message || 'Failed to place bid' });
    }
  }

  private async handleJoinAuction(socket: any, data: any) {
    try {
      const { auctionId } = data;
      const user = socket.data.user;

      // Verify auction exists and is active
      const auction = await this.prisma.liveAuction.findUnique({
        where: { id: auctionId },
        select: { id: true, status: true, streamId: true }
      });

      if (!auction) {
        socket.emit('error', { message: 'Auction not found' });
        return;
      }

      if (auction.status !== 'ACTIVE') {
        socket.emit('error', { message: 'Auction is not active' });
        return;
      }

      // Join the auction room
      socket.join(`auction:${auctionId}`);

      // Get current auction state
      const auctionState = await this.auctionManager.getAuction(auctionId);

      // Send current auction state to the joining user
      socket.emit('auctionState', {
        auction: auctionState,
        currentBids: auctionState.bids
      });

      // Notify others in the auction
      socket.to(`auction:${auctionId}`).emit('userJoinedAuction', {
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar
        }
      });

      logger.info(`User ${user.name} joined auction ${auctionId}`);
    } catch (error) {
      logger.error('Error handling joinAuction', error);
      socket.emit('error', { message: 'Failed to join auction' });
    }
  }

  private async handleLeaveAuction(socket: any, data: any) {
    try {
      const { auctionId } = data;
      const user = socket.data.user;

      // Leave the auction room
      socket.leave(`auction:${auctionId}`);

      // Notify others in the auction
      socket.to(`auction:${auctionId}`).emit('userLeftAuction', {
        user: {
          id: user.id,
          name: user.name
        }
      });

      logger.info(`User ${user.name} left auction ${auctionId}`);
    } catch (error) {
      logger.error('Error handling leaveAuction', error);
      socket.emit('error', { message: 'Failed to leave auction' });
    }
  }

  private async handleHeartbeat(socket: any, data: any) {
    try {
      const { streamId } = data;
      const user = socket.data.user;

      // Update viewer presence
      await this.analyticsManager.trackViewerEvent({
        streamId,
        userId: user.id,
        eventType: 'heartbeat',
        timestamp: new Date(),
        metadata: {
          socketId: socket.id
        }
      });

      // Send acknowledgment
      socket.emit('heartbeatAck', { timestamp: new Date() });
    } catch (error) {
      logger.error('Error handling heartbeat', error);
    }
  }

  private async handleViewerInteraction(socket: any, data: any) {
    try {
      const { streamId, interactionType, metadata } = data;
      const user = socket.data.user;

      // Track interaction
      await this.analyticsManager.trackViewerEvent({
        streamId,
        userId: user.id,
        eventType: 'interaction',
        timestamp: new Date(),
        metadata: {
          interactionType,
          ...metadata
        }
      });

      // Broadcast certain interactions to stream
      if (interactionType === 'like' || interactionType === 'share') {
        socket.to(`stream:${streamId}`).emit('viewerInteraction', {
          user: {
            id: user.id,
            name: user.name,
            avatar: user.avatar
          },
          interactionType,
          timestamp: new Date()
        });
      }
    } catch (error) {
      logger.error('Error handling viewerInteraction', error);
    }
  }

  private async handleDisconnect(socket: any) {
    try {
      const user = socket.data.user;
      
      // Remove user connection
      this.removeUserConnection(user.id, socket.id);

      // Handle leaving any streams the user was in
      const rooms = Array.from(socket.rooms);
      for (const room of rooms) {
        if (room.startsWith('stream:')) {
          const streamId = room.replace('stream:', '');
          await this.handleLeaveStream(socket, { streamId });
        } else if (room.startsWith('auction:')) {
          const auctionId = room.replace('auction:', '');
          await this.handleLeaveAuction(socket, { auctionId });
        }
      }

      logger.info(`User ${user.name} disconnected`);
    } catch (error) {
      logger.error('Error handling disconnect', error);
    }
  }

  private addUserConnection(userId: string, socketId: string) {
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  private async getStreamViewerCount(streamId: string): Promise<number> {
    const room = this.io.sockets.adapter.rooms.get(`stream:${streamId}`);
    return room ? room.size : 0;
  }

  private setupPeriodicTasks() {
    // Update viewer counts every 30 seconds
    setInterval(async () => {
      try {
        const streams = await this.prisma.liveStream.findMany({
          where: { status: 'LIVE' },
          select: { id: true }
        });

        for (const stream of streams) {
          const viewerCount = await this.getStreamViewerCount(stream.id);
          
          // Broadcast updated viewer count
          this.io.to(`stream:${stream.id}`).emit('viewerCount', { count: viewerCount });
          
          // Store in Redis for quick access
          await this.redis.setex(`stream:${stream.id}:viewers`, 60, viewerCount.toString());
        }
      } catch (error) {
        logger.error('Error updating viewer counts', error);
      }
    }, 30000);
  }

  // Public methods for external use
  async broadcastToStream(streamId: string, event: string, data: any) {
    this.io.to(`stream:${streamId}`).emit(event, data);
  }

  async broadcastToAuction(auctionId: string, event: string, data: any) {
    this.io.to(`auction:${auctionId}`).emit(event, data);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}