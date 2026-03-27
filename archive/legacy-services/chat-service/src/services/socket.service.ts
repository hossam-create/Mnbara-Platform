import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { ChatService } from './chat.service';
import { logger } from '../utils/logger';
import { TypingDto } from '../types/chat.types';

export class SocketService {
  private io: SocketServer;
  private chatService: ChatService;
  private userSockets: Map<string, Set<string>>; // userId -> Set of socketIds

  constructor(httpServer: HttpServer) {
    this.io = new SocketServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.chatService = new ChatService();
    this.userSockets = new Map();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        socket.data.userId = decoded.userId;
        
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      logger.info(`User connected: ${userId} (${socket.id})`);

      // Track user socket
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user's conversations
      this.joinUserConversations(socket, userId);

      // Message events
      socket.on('message:send', (data) => this.handleSendMessage(socket, data));
      socket.on('message:edit', (data) => this.handleEditMessage(socket, data));
      socket.on('message:delete', (data) => this.handleDeleteMessage(socket, data));
      socket.on('message:react', (data) => this.handleReaction(socket, data));
      socket.on('message:read', (data) => this.handleMarkAsRead(socket, data));

      // Typing events
      socket.on('typing:start', (data) => this.handleTypingStart(socket, data));
      socket.on('typing:stop', (data) => this.handleTypingStop(socket, data));

      // Conversation events
      socket.on('conversation:join', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on('conversation:leave', (conversationId) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // Disconnect
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${userId} (${socket.id})`);
        const sockets = this.userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });
  }

  private async joinUserConversations(socket: Socket, userId: string) {
    try {
      const conversations = await this.chatService.getUserConversations(userId);
      conversations.forEach((conv) => {
        socket.join(`conversation:${conv.id}`);
      });
    } catch (error) {
      logger.error('Error joining conversations:', error);
    }
  }

  private async handleSendMessage(socket: Socket, data: any) {
    try {
      const message = await this.chatService.sendMessage({
        ...data,
        senderId: socket.data.userId,
      });

      // Emit to conversation room
      this.io.to(`conversation:${data.conversationId}`).emit('message:new', message);

      // Send delivery confirmation to sender
      socket.emit('message:sent', { tempId: data.tempId, message });
    } catch (error) {
      logger.error('Error sending message:', error);
      socket.emit('message:error', { error: 'Failed to send message' });
    }
  }

  private async handleEditMessage(socket: Socket, data: any) {
    try {
      const message = await this.chatService.editMessage({
        ...data,
        userId: socket.data.userId,
      });

      this.io.to(`conversation:${message.conversationId}`).emit('message:edited', message);
    } catch (error) {
      logger.error('Error editing message:', error);
      socket.emit('message:error', { error: 'Failed to edit message' });
    }
  }

  private async handleDeleteMessage(socket: Socket, data: any) {
    try {
      const message = await this.chatService.deleteMessage({
        ...data,
        userId: socket.data.userId,
      });

      this.io.to(`conversation:${message.conversationId}`).emit('message:deleted', {
        messageId: message.id,
        conversationId: message.conversationId,
      });
    } catch (error) {
      logger.error('Error deleting message:', error);
      socket.emit('message:error', { error: 'Failed to delete message' });
    }
  }

  private async handleReaction(socket: Socket, data: any) {
    try {
      await this.chatService.addReaction({
        ...data,
        userId: socket.data.userId,
      });

      const message = await this.chatService.getMessages(data.conversationId, 1);
      if (message[0]) {
        this.io.to(`conversation:${data.conversationId}`).emit('message:reaction', {
          messageId: data.messageId,
          userId: socket.data.userId,
          emoji: data.emoji,
        });
      }
    } catch (error) {
      logger.error('Error adding reaction:', error);
    }
  }

  private async handleMarkAsRead(socket: Socket, data: any) {
    try {
      await this.chatService.markAsRead({
        ...data,
        userId: socket.data.userId,
      });

      this.io.to(`conversation:${data.conversationId}`).emit('message:read', {
        conversationId: data.conversationId,
        userId: socket.data.userId,
        messageId: data.messageId,
      });
    } catch (error) {
      logger.error('Error marking as read:', error);
    }
  }

  private handleTypingStart(socket: Socket, data: TypingDto) {
    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: socket.data.userId,
    });
  }

  private handleTypingStop(socket: Socket, data: TypingDto) {
    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: socket.data.userId,
    });
  }

  public emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.forEach((socketId) => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  public emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }
}
