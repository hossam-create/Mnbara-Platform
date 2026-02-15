import { Server as SocketIOServer, Socket } from 'socket.io';
import { EventEmitter } from 'events';
import { logger } from '@/utils/logger';
import { CustomError } from '@/utils/error-handler';
import { ChatMessage, ChatReaction } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface ChatUser {
  id: string;
  username: string;
  socketId: string;
  isModerator: boolean;
  isStreamer: boolean;
  joinedAt: Date;
  lastActivity: Date;
  metadata: Record<string, any>;
}

export interface ChatRoom {
  id: string;
  name: string;
  streamId: string;
  users: Map<string, ChatUser>;
  messages: ChatMessage[];
  settings: ChatRoomSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoomSettings {
  maxUsers: number;
  rateLimitWindow: number;
  rateLimitMax: number;
  messageMaxLength: number;
  enableReactions: boolean;
  enableReplies: boolean;
  enableModeration: boolean;
  slowModeDelay: number;
  followersOnly: boolean;
  subscribersOnly: boolean;
  emoteOnly: boolean;
}

export class WebSocketServer extends EventEmitter {
  private io: SocketIOServer;
  private rooms: Map<string, ChatRoom> = new Map();
  private userRooms: Map<string, string> = new Map();
  private messageHistory: Map<string, ChatMessage[]> = new Map();
  private rateLimiters: Map<string, number[]> = new Map();
  private running: boolean = false;

  constructor(io: SocketIOServer) {
    super();
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`User connected: ${socket.id}`);

      socket.on('join-room', async (data: {
        roomId: string;
        username: string;
        isModerator?: boolean;
        isStreamer?: boolean;
        metadata?: Record<string, any>;
      }) => {
        try {
          await this.handleJoinRoom(socket, data);
        } catch (error) {
          logger.error('Error joining room:', error);
          socket.emit('error', { message: 'Failed to join room' });
        }
      });

      socket.on('send-message', async (data: {
        roomId: string;
        message: string;
        replyTo?: string;
      }) => {
        try {
          await this.handleSendMessage(socket, data);
        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('react-to-message', async (data: {
        roomId: string;
        messageId: string;
        emoji: string;
      }) => {
        try {
          await this.handleReactToMessage(socket, data);
        } catch (error) {
          logger.error('Error reacting to message:', error);
          socket.emit('error', { message: 'Failed to react to message' });
        }
      });

      socket.on('delete-message', async (data: {
        roomId: string;
        messageId: string;
      }) => {
        try {
          await this.handleDeleteMessage(socket, data);
        } catch (error) {
          logger.error('Error deleting message:', error);
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      socket.on('edit-message', async (data: {
        roomId: string;
        messageId: string;
        newMessage: string;
      }) => {
        try {
          await this.handleEditMessage(socket, data);
        } catch (error) {
          logger.error('Error editing message:', error);
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      socket.on('get-message-history', async (data: {
        roomId: string;
        limit?: number;
        before?: string;
      }) => {
        try {
          await this.handleGetMessageHistory(socket, data);
        } catch (error) {
          logger.error('Error getting message history:', error);
          socket.emit('error', { message: 'Failed to get message history' });
        }
      });

      socket.on('get-room-users', async (data: {
        roomId: string;
      }) => {
        try {
          await this.handleGetRoomUsers(socket, data);
        } catch (error) {
          logger.error('Error getting room users:', error);
          socket.emit('error', { message: 'Failed to get room users' });
        }
      });

      socket.on('leave-room', async (data: {
        roomId: string;
      }) => {
        try {
          await this.handleLeaveRoom(socket, data);
        } catch (error) {
          logger.error('Error leaving room:', error);
          socket.emit('error', { message: 'Failed to leave room' });
        }
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinRoom(socket: Socket, data: {
    roomId: string;
    username: string;
    isModerator?: boolean;
    isStreamer?: boolean;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { roomId, username, isModerator = false, isStreamer = false, metadata = {} } = data;

    // Validate input
    if (!roomId || !username) {
      throw new CustomError('Room ID and username are required', 400);
    }

    if (username.length > 50) {
      throw new CustomError('Username too long', 400);
    }

    // Get or create room
    let room = this.rooms.get(roomId);
    if (!room) {
      room = this.createRoom(roomId, roomId); // Use roomId as streamId for now
      this.rooms.set(roomId, room);
    }

    // Check room capacity
    if (room.users.size >= room.settings.maxUsers) {
      throw new CustomError('Room is full', 403);
    }

    // Check if user is already in room
    if (this.userRooms.has(socket.id)) {
      await this.handleLeaveRoom(socket, { roomId: this.userRooms.get(socket.id)! });
    }

    // Create user
    const user: ChatUser = {
      id: socket.id,
      username,
      socketId: socket.id,
      isModerator,
      isStreamer,
      joinedAt: new Date(),
      lastActivity: new Date(),
      metadata
    };

    // Add user to room
    room.users.set(socket.id, user);
    this.userRooms.set(socket.id, roomId);

    // Join socket room
    socket.join(roomId);

    // Send room info to user
    socket.emit('room-joined', {
      roomId,
      room: {
        id: room.id,
        name: room.name,
        userCount: room.users.size,
        settings: room.settings
      },
      user
    });

    // Notify other users
    socket.to(roomId).emit('user-joined', {
      user,
      userCount: room.users.size
    });

    logger.info(`User ${username} joined room ${roomId}`);
  }

  private async handleSendMessage(socket: Socket, data: {
    roomId: string;
    message: string;
    replyTo?: string;
  }): Promise<void> {
    const { roomId, message, replyTo } = data;

    // Validate input
    if (!roomId || !message) {
      throw new CustomError('Room ID and message are required', 400);
    }

    // Check if user is in room
    const room = this.rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      throw new CustomError('Not in room', 403);
    }

    const user = room.users.get(socket.id)!;
    const settings = room.settings;

    // Check message length
    if (message.length > settings.messageMaxLength) {
      throw new CustomError('Message too long', 400);
    }

    // Check rate limiting
    if (!this.checkRateLimit(socket.id, settings.rateLimitWindow, settings.rateLimitMax)) {
      throw new CustomError('Rate limit exceeded', 429);
    }

    // Check slow mode
    if (settings.slowModeDelay > 0) {
      const lastMessage = this.getLastMessageTime(socket.id);
      if (lastMessage && Date.now() - lastMessage < settings.slowModeDelay) {
        throw new CustomError('Slow mode active', 429);
      }
    }

    // Check reply permissions
    if (replyTo && !settings.enableReplies) {
      throw new CustomError('Replies not allowed', 403);
    }

    // Create message
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      streamId: room.streamId,
      userId: user.id,
      username: user.username,
      message: message.trim(),
      timestamp: new Date(),
      isModerator: user.isModerator,
      isStreamer: user.isStreamer,
      isDeleted: false,
      isEdited: false,
      replyTo,
      reactions: [],
      metadata: {}
    };

    // Add to room messages
    room.messages.push(chatMessage);
    
    // Keep only recent messages
    if (room.messages.length > 1000) {
      room.messages = room.messages.slice(-1000);
    }

    // Update user activity
    user.lastActivity = new Date();

    // Broadcast message
    this.io.to(roomId).emit('new-message', {
      message: chatMessage,
      userCount: room.users.size
    });

    logger.debug(`Message sent in room ${roomId} by ${user.username}`);
  }

  private async handleReactToMessage(socket: Socket, data: {
    roomId: string;
    messageId: string;
    emoji: string;
  }): Promise<void> {
    const { roomId, messageId, emoji } = data;

    // Validate input
    if (!roomId || !messageId || !emoji) {
      throw new CustomError('Room ID, message ID, and emoji are required', 400);
    }

    // Check if user is in room
    const room = this.rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      throw new CustomError('Not in room', 403);
    }

    const settings = room.settings;

    // Check if reactions are enabled
    if (!settings.enableReactions) {
      throw new CustomError('Reactions not allowed', 403);
    }

    // Find message
    const message = room.messages.find(m => m.id === messageId);
    if (!message) {
      throw new CustomError('Message not found', 404);
    }

    // Update reaction
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    const userId = socket.id;

    if (existingReaction) {
      if (existingReaction.users.includes(userId)) {
        // Remove reaction
        existingReaction.users = existingReaction.users.filter(id => id !== userId);
        existingReaction.count = existingReaction.users.length;
        
        if (existingReaction.count === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add reaction
        existingReaction.users.push(userId);
        existingReaction.count = existingReaction.users.length;
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        count: 1,
        users: [userId]
      });
    }

    // Broadcast reaction update
    this.io.to(roomId).emit('message-reaction', {
      messageId,
      reactions: message.reactions
    });

    logger.debug(`Reaction added to message ${messageId} in room ${roomId}`);
  }

  private async handleDeleteMessage(socket: Socket, data: {
    roomId: string;
    messageId: string;
  }): Promise<void> {
    const { roomId, messageId } = data;

    // Check if user is in room
    const room = this.rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      throw new CustomError('Not in room', 403);
    }

    const user = room.users.get(socket.id)!;
    const message = room.messages.find(m => m.id === messageId);
    
    if (!message) {
      throw new CustomError('Message not found', 404);
    }

    // Check permissions
    if (!user.isModerator && !user.isStreamer && message.userId !== user.id) {
      throw new CustomError('Permission denied', 403);
    }

    // Mark message as deleted
    message.isDeleted = true;
    message.message = '[Message deleted]';

    // Broadcast deletion
    this.io.to(roomId).emit('message-deleted', {
      messageId,
      deletedBy: user.id
    });

    logger.info(`Message ${messageId} deleted by ${user.username} in room ${roomId}`);
  }

  private async handleEditMessage(socket: Socket, data: {
    roomId: string;
    messageId: string;
    newMessage: string;
  }): Promise<void> {
    const { roomId, messageId, newMessage } = data;

    // Check if user is in room
    const room = this.rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      throw new CustomError('Not in room', 403);
    }

    const user = room.users.get(socket.id)!;
    const message = room.messages.find(m => m.id === messageId);
    
    if (!message) {
      throw new CustomError('Message not found', 404);
    }

    // Check permissions
    if (message.userId !== user.id) {
      throw new CustomError('Can only edit your own messages', 403);
    }

    // Check message length
    if (newMessage.length > room.settings.messageMaxLength) {
      throw new CustomError('Message too long', 400);
    }

    // Update message
    message.message = newMessage.trim();
    message.isEdited = true;
    message.editedAt = new Date();

    // Broadcast edit
    this.io.to(roomId).emit('message-edited', {
      messageId,
      newMessage: message.message,
      editedAt: message.editedAt
    });

    logger.debug(`Message ${messageId} edited by ${user.username} in room ${roomId}`);
  }

  private async handleGetMessageHistory(socket: Socket, data: {
    roomId: string;
    limit?: number;
    before?: string;
  }): Promise<void> {
    const { roomId, limit = 50, before } = data;

    // Check if user is in room
    const room = this.rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      throw new CustomError('Not in room', 403);
    }

    let messages = room.messages;

    // Filter by before timestamp if provided
    if (before) {
      const beforeMessage = room.messages.find(m => m.id === before);
      if (beforeMessage) {
        const beforeIndex = room.messages.indexOf(beforeMessage);
        messages = room.messages.slice(0, beforeIndex);
      }
    }

    // Get recent messages
    const recentMessages = messages.slice(-limit);

    socket.emit('message-history', {
      messages: recentMessages,
      hasMore: messages.length > limit
    });
  }

  private async handleGetRoomUsers(socket: Socket, data: {
    roomId: string;
  }): Promise<void> {
    const { roomId } = data;

    // Check if user is in room
    const room = this.rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      throw new CustomError('Not in room', 403);
    }

    const users = Array.from(room.users.values()).map(user => ({
      id: user.id,
      username: user.username,
      isModerator: user.isModerator,
      isStreamer: user.isStreamer,
      joinedAt: user.joinedAt,
      lastActivity: user.lastActivity
    }));

    socket.emit('room-users', {
      users,
      totalCount: users.length
    });
  }

  private async handleLeaveRoom(socket: Socket, data: {
    roomId: string;
  }): Promise<void> {
    const { roomId } = data;

    const room = this.rooms.get(roomId);
    if (!room || !room.users.has(socket.id)) {
      return;
    }

    const user = room.users.get(socket.id)!;

    // Remove user from room
    room.users.delete(socket.id);
    this.userRooms.delete(socket.id);

    // Leave socket room
    socket.leave(roomId);

    // Notify other users
    socket.to(roomId).emit('user-left', {
      userId: user.id,
      username: user.username,
      userCount: room.users.size
    });

    // Clean up empty rooms
    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      this.messageHistory.delete(roomId);
      this.rateLimiters.delete(roomId);
    }

    socket.emit('room-left', { roomId });

    logger.info(`User ${user.username} left room ${roomId}`);
  }

  private handleDisconnect(socket: Socket): void {
    const roomId = this.userRooms.get(socket.id);
    
    if (roomId) {
      this.handleLeaveRoom(socket, { roomId }).catch(error => {
        logger.error('Error handling disconnect:', error);
      });
    }

    logger.info(`User disconnected: ${socket.id}`);
  }

  private createRoom(roomId: string, streamId: string): ChatRoom {
    return {
      id: roomId,
      name: `Stream Chat ${streamId}`,
      streamId,
      users: new Map(),
      messages: [],
      settings: {
        maxUsers: 1000,
        rateLimitWindow: 60000, // 1 minute
        rateLimitMax: 30, // 30 messages per minute
        messageMaxLength: 500,
        enableReactions: true,
        enableReplies: true,
        enableModeration: true,
        slowModeDelay: 0,
        followersOnly: false,
        subscribersOnly: false,
        emoteOnly: false
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private checkRateLimit(userId: string, windowMs: number, maxRequests: number): boolean {
    const now = Date.now();
    const key = userId;
    
    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, []);
    }
    
    const timestamps = this.rateLimiters.get(key)!;
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(timestamp => now - timestamp < windowMs);
    
    // Check if limit exceeded
    if (validTimestamps.length >= maxRequests) {
      return false;
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    this.rateLimiters.set(key, validTimestamps);
    
    return true;
  }

  private getLastMessageTime(userId: string): number | null {
    const roomId = this.userRooms.get(userId);
    if (!roomId) return null;
    
    const room = this.rooms.get(roomId);
    if (!room) return null;
    
    const userMessages = room.messages.filter(m => m.userId === userId);
    if (userMessages.length === 0) return null;
    
    const lastMessage = userMessages[userMessages.length - 1];
    return lastMessage.timestamp.getTime();
  }

  public async start(): Promise<void> {
    logger.info('WebSocket server started');
    this.running = true;
  }

  public async stop(): Promise<void> {
    logger.info('WebSocket server stopping...');
    this.running = false;
    
    // Disconnect all users
    this.io.disconnectSockets();
    
    // Clear all data
    this.rooms.clear();
    this.userRooms.clear();
    this.messageHistory.clear();
    this.rateLimiters.clear();
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getRoomInfo(roomId: string): ChatRoom | undefined {
    return this.rooms.get(roomId);
  }

  public getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }

  public getTotalUsers(): number {
    return this.userRooms.size;
  }
}