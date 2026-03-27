// AR Service - خدمة الواقع المعزز
// 3D model management, AR sessions, analytics

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Types
type ModelStatus = 'PROCESSING' | 'READY' | 'ERROR' | 'ARCHIVED';
type AnchorType = 'PLANE' | 'VERTICAL' | 'IMAGE' | 'FACE' | 'BODY';

export class ARService {
  // ==========================================
  // 📦 3D MODEL MANAGEMENT
  // ==========================================

  async createModel(data: {
    productId: string;
    glbUrl: string;
    usdzUrl?: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    depth?: number;
    scale?: number;
    anchorType?: AnchorType;
  }) {
    return prisma.product3DModel.create({
      data: {
        ...data,
        status: 'PROCESSING',
      },
    });
  }

  async getModel(productId: string) {
    const cacheKey = `ar:model:${productId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const model = await prisma.product3DModel.findUnique({
      where: { productId },
      include: { textures: true },
    });

    if (model && model.status === 'READY') {
      await redis.setex(cacheKey, 3600, JSON.stringify(model)); // Cache for 1 hour
    }

    return model;
  }

  async updateModelStatus(productId: string, status: ModelStatus, error?: string) {
    const model = await prisma.product3DModel.update({
      where: { productId },
      data: {
        status,
        processingError: error,
      },
    });

    // Invalidate cache
    await redis.del(`ar:model:${productId}`);

    return model;
  }

  async getModels(filters: {
    status?: ModelStatus;
    page?: number;
    limit?: number;
  }) {
    const { status, page = 1, limit = 20 } = filters;

    const [models, total] = await Promise.all([
      prisma.product3DModel.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product3DModel.count({
        where: status ? { status } : undefined,
      }),
    ]);

    return { models, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async incrementViewCount(productId: string) {
    await prisma.product3DModel.update({
      where: { productId },
      data: { viewCount: { increment: 1 } },
    });
  }

  // ==========================================
  // 📱 AR SESSION MANAGEMENT
  // ==========================================

  async startSession(data: {
    userId?: string;
    productId: string;
    deviceType?: string;
    deviceModel?: string;
    osVersion?: string;
    arFramework?: string;
  }) {
    const session = await prisma.aRSession.create({ data });

    // Increment model AR session count
    await prisma.product3DModel.update({
      where: { productId: data.productId },
      data: { arSessionCount: { increment: 1 } },
    });

    // Update daily analytics
    await this.updateAnalytics('totalSessions', data.deviceType);

    return session;
  }

  async endSession(sessionId: string, data: {
    duration?: number;
    framesRendered?: number;
    avgFPS?: number;
    rotations?: number;
    scales?: number;
    screenshots?: number;
    placementType?: AnchorType;
    placementSuccess?: boolean;
    addedToCart?: boolean;
    purchased?: boolean;
  }) {
    const session = await prisma.aRSession.update({
      where: { id: sessionId },
      data: {
        ...data,
        endedAt: new Date(),
      },
    });

    // Update analytics
    if (data.addedToCart) {
      await this.updateAnalytics('addToCartCount');
    }
    if (data.purchased) {
      await this.updateAnalytics('purchaseCount');
    }

    return session;
  }

  async getSession(sessionId: string) {
    return prisma.aRSession.findUnique({ where: { id: sessionId } });
  }

  async getUserSessions(userId: string, page: number = 1, limit: number = 20) {
    const [sessions, total] = await Promise.all([
      prisma.aRSession.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aRSession.count({ where: { userId } }),
    ]);

    return { sessions, total, page, limit };
  }

  // ==========================================
  // 📸 SCREENSHOT MANAGEMENT
  // ==========================================

  async saveScreenshot(data: {
    sessionId: string;
    userId?: string;
    productId: string;
    imageUrl: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
  }) {
    const screenshot = await prisma.aRScreenshot.create({ data });

    // Update session screenshot count
    await prisma.aRSession.update({
      where: { id: data.sessionId },
      data: { screenshots: { increment: 1 } },
    });

    // Update analytics
    await this.updateAnalytics('totalScreenshots');

    return screenshot;
  }

  async getUserScreenshots(userId: string, page: number = 1, limit: number = 20) {
    const [screenshots, total] = await Promise.all([
      prisma.aRScreenshot.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aRScreenshot.count({ where: { userId } }),
    ]);

    return { screenshots, total, page, limit };
  }

  async shareScreenshot(screenshotId: string) {
    return prisma.aRScreenshot.update({
      where: { id: screenshotId },
      data: {
        isShared: true,
        shareCount: { increment: 1 },
      },
    });
  }

  // ==========================================
  // 📊 ANALYTICS
  // ==========================================

  private async updateAnalytics(
    field: 'totalSessions' | 'addToCartCount' | 'purchaseCount' | 'totalScreenshots',
    deviceType?: string
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deviceField = deviceType?.toLowerCase().includes('ios')
      ? 'iosSessions'
      : deviceType?.toLowerCase().includes('android')
      ? 'androidSessions'
      : 'webSessions';

    await prisma.aRAnalytics.upsert({
      where: { date: today },
      update: {
        [field]: { increment: 1 },
        ...(field === 'totalSessions' && { [deviceField]: { increment: 1 } }),
      },
      create: {
        date: today,
        [field]: 1,
        ...(field === 'totalSessions' && { [deviceField]: 1 }),
      },
    });
  }

  async getAnalytics(startDate: Date, endDate: Date) {
    return prisma.aRAnalytics.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [todayStats, weekStats, totalModels, readyModels] = await Promise.all([
      prisma.aRAnalytics.findUnique({ where: { date: today } }),
      prisma.aRAnalytics.aggregate({
        where: { date: { gte: weekAgo } },
        _sum: {
          totalSessions: true,
          addToCartCount: true,
          purchaseCount: true,
          totalScreenshots: true,
        },
        _avg: {
          avgDuration: true,
          conversionRate: true,
        },
      }),
      prisma.product3DModel.count(),
      prisma.product3DModel.count({ where: { status: 'READY' } }),
    ]);

    return {
      today: todayStats,
      week: weekStats,
      models: { total: totalModels, ready: readyModels },
    };
  }

  // ==========================================
  // 🎯 AR MARKERS
  // ==========================================

  async createMarker(data: {
    name: string;
    nameAr?: string;
    type: 'PRODUCT' | 'PROMOTIONAL' | 'NAVIGATION' | 'INTERACTIVE';
    imageUrl: string;
    width: number;
    productId?: string;
    contentUrl?: string;
    contentType?: string;
  }) {
    return prisma.aRMarker.create({ data });
  }

  async getMarkers(type?: string) {
    return prisma.aRMarker.findMany({
      where: {
        isActive: true,
        ...(type && { type: type as any }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMarker(markerId: string) {
    return prisma.aRMarker.findUnique({ where: { id: markerId } });
  }
}

export const arService = new ARService();
