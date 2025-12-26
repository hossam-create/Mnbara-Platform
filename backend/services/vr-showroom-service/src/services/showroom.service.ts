// Showroom Service - خدمة صالة العرض

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

type ShowroomStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type EnvironmentType = 'MODERN_STORE' | 'LUXURY_BOUTIQUE' | 'WAREHOUSE' | 'OUTDOOR_MARKET' | 'GALLERY' | 'CUSTOM';

export class ShowroomService {
  // ==========================================
  // 🏪 SHOWROOM MANAGEMENT
  // ==========================================

  async createShowroom(data: {
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
    ownerId: string;
    ownerType: 'SELLER' | 'BRAND' | 'PLATFORM';
    environmentType?: EnvironmentType;
    customSceneUrl?: string;
    maxConcurrentUsers?: number;
  }) {
    return prisma.virtualShowroom.create({
      data: {
        ...data,
        layout: { products: [] },
      },
    });
  }

  async getShowroom(showroomId: string) {
    const cacheKey = `vr:showroom:${showroomId}`;
    const cached = await redis.get(cacheKey);
    
    if (cached) return JSON.parse(cached);

    const showroom = await prisma.virtualShowroom.findUnique({
      where: { id: showroomId },
      include: {
        products: true,
        events: { where: { status: { in: ['SCHEDULED', 'LIVE'] } } },
      },
    });

    if (showroom) {
      await redis.setex(cacheKey, 300, JSON.stringify(showroom)); // Cache 5 min
    }

    return showroom;
  }

  async getShowrooms(filters: {
    ownerId?: string;
    ownerType?: string;
    status?: ShowroomStatus;
    page?: number;
    limit?: number;
  }) {
    const { ownerId, ownerType, status, page = 1, limit = 20 } = filters;

    const [showrooms, total] = await Promise.all([
      prisma.virtualShowroom.findMany({
        where: {
          ...(ownerId && { ownerId }),
          ...(ownerType && { ownerType: ownerType as any }),
          ...(status && { status }),
          isPublic: true,
        },
        include: { _count: { select: { products: true } } },
        orderBy: { totalVisits: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.virtualShowroom.count({
        where: {
          ...(ownerId && { ownerId }),
          ...(status && { status }),
          isPublic: true,
        },
      }),
    ]);

    return { showrooms, total, page, limit };
  }

  async updateShowroom(showroomId: string, data: Partial<{
    name: string;
    nameAr: string;
    description: string;
    descriptionAr: string;
    environmentType: EnvironmentType;
    customSceneUrl: string;
    skyboxUrl: string;
    layout: any;
    maxConcurrentUsers: number;
    isPublic: boolean;
    status: ShowroomStatus;
  }>) {
    const showroom = await prisma.virtualShowroom.update({
      where: { id: showroomId },
      data,
    });

    await redis.del(`vr:showroom:${showroomId}`);
    return showroom;
  }

  async publishShowroom(showroomId: string) {
    return this.updateShowroom(showroomId, { status: 'PUBLISHED' });
  }

  // ==========================================
  // 📦 PRODUCT MANAGEMENT
  // ==========================================

  async addProduct(showroomId: string, data: {
    productId: string;
    modelUrl: string;
    thumbnailUrl?: string;
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationY?: number;
    scale?: number;
    displayType?: 'PEDESTAL' | 'SHELF' | 'WALL_MOUNT' | 'FLOOR' | 'HANGING' | 'MANNEQUIN';
  }) {
    const product = await prisma.showroomProduct.create({
      data: { showroomId, ...data },
    });

    await redis.del(`vr:showroom:${showroomId}`);
    return product;
  }

  async updateProductPosition(productId: string, position: {
    positionX: number;
    positionY: number;
    positionZ: number;
    rotationY?: number;
    scale?: number;
  }) {
    return prisma.showroomProduct.update({
      where: { id: productId },
      data: position,
    });
  }

  async removeProduct(productId: string) {
    const product = await prisma.showroomProduct.delete({
      where: { id: productId },
    });
    await redis.del(`vr:showroom:${product.showroomId}`);
    return product;
  }

  async trackProductInteraction(productId: string, action: 'view' | 'pickup' | 'addToCart') {
    const field = action === 'view' ? 'viewCount' : action === 'pickup' ? 'pickupCount' : 'addToCartCount';
    
    await prisma.showroomProduct.update({
      where: { id: productId },
      data: { [field]: { increment: 1 } },
    });
  }

  // ==========================================
  // 👤 SESSION MANAGEMENT
  // ==========================================

  async startSession(showroomId: string, data: {
    userId?: string;
    deviceType?: string;
    headsetModel?: string;
  }) {
    // Increment visit count
    await prisma.virtualShowroom.update({
      where: { id: showroomId },
      data: { totalVisits: { increment: 1 } },
    });

    return prisma.vRSession.create({
      data: { showroomId, ...data },
    });
  }

  async endSession(sessionId: string, data: {
    duration?: number;
    distanceTraveled?: number;
    roomsVisited?: number;
    productsViewed?: number;
    productsPickedUp?: number;
    addedToCart?: number;
    usersInteracted?: number;
  }) {
    const session = await prisma.vRSession.update({
      where: { id: sessionId },
      data: { ...data, endedAt: new Date() },
    });

    // Update analytics
    await this.updateAnalytics(session.showroomId, data);

    return session;
  }

  // ==========================================
  // 📊 ANALYTICS
  // ==========================================

  private async updateAnalytics(showroomId: string, sessionData: any) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.vRAnalytics.upsert({
      where: { date_showroomId: { date: today, showroomId } },
      update: {
        totalSessions: { increment: 1 },
        productsViewed: { increment: sessionData.productsViewed || 0 },
        productsPickedUp: { increment: sessionData.productsPickedUp || 0 },
        addToCartCount: { increment: sessionData.addedToCart || 0 },
      },
      create: {
        date: today,
        showroomId,
        totalSessions: 1,
        productsViewed: sessionData.productsViewed || 0,
        productsPickedUp: sessionData.productsPickedUp || 0,
        addToCartCount: sessionData.addedToCart || 0,
      },
    });
  }

  async getAnalytics(showroomId: string, startDate: Date, endDate: Date) {
    return prisma.vRAnalytics.findMany({
      where: {
        showroomId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getDashboardStats(showroomId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const where = showroomId ? { showroomId } : {};

    const [todayStats, weekStats] = await Promise.all([
      prisma.vRAnalytics.aggregate({
        where: { ...where, date: today },
        _sum: { totalSessions: true, addToCartCount: true, revenue: true },
      }),
      prisma.vRAnalytics.aggregate({
        where: { ...where, date: { gte: weekAgo } },
        _sum: { totalSessions: true, addToCartCount: true, revenue: true },
        _avg: { avgDuration: true },
      }),
    ]);

    return { today: todayStats._sum, week: { ...weekStats._sum, avgDuration: weekStats._avg.avgDuration } };
  }
}

export const showroomService = new ShowroomService();
