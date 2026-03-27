import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { CustomError } from '../utils/error-handler';

export class DatabaseService {
  private static instance: DatabaseService;
  private prisma: PrismaClient;
  private isConnected: boolean = false;

  private constructor() {
    this.prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this.prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query} | Params: ${e.params} | Duration: ${e.duration}ms`);
      });
    }

    // Log errors
    this.prisma.$on('error', (e) => {
      logger.error('Prisma error:', e);
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        logger.debug('Database already connected');
        return;
      }

      logger.info('Connecting to database...');
      await this.prisma.$connect();
      this.isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      throw new CustomError('Database connection failed', 500);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.debug('Database not connected');
        return;
      }

      logger.info('Disconnecting from database...');
      await this.prisma.$disconnect();
      this.isConnected = false;
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
      throw new CustomError('Database disconnection failed', 500);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  public async transaction<T>(fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        return await fn(tx);
      });
    } catch (error) {
      logger.error('Database transaction failed:', error);
      throw new CustomError('Transaction failed', 500);
    }
  }

  // Helper methods for common operations
  public async createStream(data: any) {
    return await this.prisma.liveStream.create({ data });
  }

  public async updateStream(id: string, data: any) {
    return await this.prisma.liveStream.update({
      where: { id },
      data,
    });
  }

  public async getStreamById(id: string) {
    return await this.prisma.liveStream.findUnique({
      where: { id },
      include: {
        chatRoom: true,
        auctions: true,
        analytics: true,
        user: true,
      },
    });
  }

  public async getStreamByKey(streamKey: string) {
    return await this.prisma.liveStream.findUnique({
      where: { streamKey },
      include: {
        chatRoom: true,
        auctions: true,
        user: true,
      },
    });
  }

  public async getActiveStreams() {
    return await this.prisma.liveStream.findMany({
      where: { isLive: true },
      include: {
        chatRoom: true,
        auctions: true,
        user: true,
      },
      orderBy: { viewerCount: 'desc' },
    });
  }

  public async createChatRoom(data: any) {
    return await this.prisma.chatRoom.create({ data });
  }

  public async getChatRoomByStreamId(streamId: string) {
    return await this.prisma.chatRoom.findUnique({
      where: { streamId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        users: true,
      },
    });
  }

  public async createChatMessage(data: any) {
    return await this.prisma.chatMessage.create({ data });
  }

  public async createAuction(data: any) {
    return await this.prisma.liveAuction.create({ data });
  }

  public async updateAuction(id: string, data: any) {
    return await this.prisma.liveAuction.update({
      where: { id },
      data,
    });
  }

  public async getAuctionById(id: string) {
    return await this.prisma.liveAuction.findUnique({
      where: { id },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          include: { bidder: true },
        },
        payments: true,
        stream: true,
        seller: true,
      },
    });
  }

  public async getActiveAuctions() {
    return await this.prisma.liveAuction.findMany({
      where: { isActive: true },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 10,
        },
        stream: true,
        seller: true,
      },
    });
  }

  public async createBid(data: any) {
    return await this.prisma.auctionBid.create({ data });
  }

  public async updateBids(auctionId: string, data: any) {
    return await this.prisma.auctionBid.updateMany({
      where: { auctionId },
      data,
    });
  }

  public async createAnalytics(data: any) {
    return await this.prisma.streamAnalytics.create({ data });
  }

  public async updateAnalytics(id: string, data: any) {
    return await this.prisma.streamAnalytics.update({
      where: { id },
      data,
    });
  }

  public async getAnalyticsByStreamId(streamId: string, date?: Date) {
    const where: any = { streamId };
    if (date) {
      where.date = {
        gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      };
    }

    return await this.prisma.streamAnalytics.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  public async createModerationViolation(data: any) {
    return await this.prisma.moderationViolation.create({ data });
  }

  public async getUserViolations(userId: string) {
    return await this.prisma.moderationViolation.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public async getChatUserByUserId(userId: string) {
    return await this.prisma.chatUser.findUnique({
      where: { userId },
      include: {
        violations: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },
        },
      },
    });
  }

  public async createChatUser(data: any) {
    return await this.prisma.chatUser.create({ data });
  }

  public async updateChatUser(id: string, data: any) {
    return await this.prisma.chatUser.update({
      where: { id },
      data,
    });
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();
export default databaseService;