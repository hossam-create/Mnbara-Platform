import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebsocketChannelService implements OnModuleDestroy {
  private readonly logger = new Logger(WebsocketChannelService.name);
  private io: any = null;
  private redisPublisher: any = null;
  private redisSubscriber: any = null;
  private userSockets: Map<string, Set<string>> = new Map();
  private socketUsers: Map<string, string> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async initialize(server: any, port: number): Promise<void> {
    try {
      const { Server } = require('socket.io');
      this.io = new Server(server, {
        cors: { origin: this.configService.get<string>('CORS_ORIGIN') || '*', methods: ['GET', 'POST'], credentials: true },
        pingTimeout: 60000, pingInterval: 25000,
      });

      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (redisUrl) {
        const Redis = require('ioredis');
        const { createAdapter } = require('@socket.io/redis-adapter');
        const url = new URL(redisUrl);
        this.redisPublisher = new Redis({ host: url.hostname, port: parseInt(url.port), password: url.password || undefined });
        this.redisSubscriber = this.redisPublisher.duplicate();
        this.io.adapter(createAdapter(this.redisPublisher, this.redisSubscriber));
      }

      this.io.on('connection', (socket: any) => this.handleConnection(socket));

      if (this.redisSubscriber) await this.subscribeToRedisChannels();

      this.logger.log(`WebSocket server initialized on port ${port}`);
    } catch (error) {
      this.logger.error('Failed to initialize WebSocket server:', error);
    }
  }

  private handleConnection(socket: any): void {
    const userId = socket.handshake.query.userId as string;
    if (!userId) { socket.disconnect(); return; }

    this.socketUsers.set(socket.id, userId);
    if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
    this.userSockets.get(userId)!.add(socket.id);

    socket.on('authenticate', () => socket.emit('authenticated', { success: true }));
    socket.on('subscribe', (channels: string[]) => {
      channels.forEach((ch: string) => { socket.join(ch); });
    });
    socket.on('unsubscribe', (channels: string[]) => {
      channels.forEach((ch: string) => { socket.leave(ch); });
    });
    socket.on('disconnect', () => this.handleDisconnection(socket.id));
    socket.on('ping', () => socket.emit('pong', { timestamp: Date.now() }));

    socket.emit('connected', { socketId: socket.id, userId, timestamp: new Date() });
    this.logger.debug(`User ${userId} connected with socket ${socket.id}`);
  }

  private handleDisconnection(socketId: string): void {
    const userId = this.socketUsers.get(socketId);
    if (userId) {
      this.userSockets.get(userId)?.delete(socketId);
      if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId);
    }
    this.socketUsers.delete(socketId);
  }

  async sendToUser(userId: string, event: any): Promise<void> {
    if (!this.io) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;
    sockets.forEach((socketId: string) => this.io.to(socketId).emit(event.type, event));
  }

  async broadcast(event: any): Promise<void> {
    if (!this.io) return;
    this.io.emit(event.type, event);
  }

  async broadcastToChannel(channel: string, event: any): Promise<void> {
    if (!this.io) return;
    this.io.to(channel).emit(event.event, event.payload);
  }

  getOnlineUsersCount(): number { return this.userSockets.size; }

  private async subscribeToRedisChannels(): Promise<void> {
    if (!this.redisSubscriber) return;
    const channels = ['notification:bid', 'notification:order', 'notification:payment', 'notification:chat', 'notification:auction'];
    this.redisSubscriber.subscribe(...channels);
    this.redisSubscriber.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message);
        if (channel === 'notification:auction') this.broadcastToChannel(`auction:${data.auctionId}`, { event: data.type, payload: data });
        else if (data.userId) this.sendToUser(data.userId, { type: channel.split(':')[1], data, timestamp: new Date() });
      } catch (err) { this.logger.error('Error handling Redis message:', err); }
    });
  }

  async onModuleDestroy() { await this.close(); }

  async close(): Promise<void> {
    if (this.io) await this.io.close();
    if (this.redisPublisher) await this.redisPublisher.quit();
    if (this.redisSubscriber) await this.redisSubscriber.quit();
    this.logger.log('WebSocket server closed');
  }
}
