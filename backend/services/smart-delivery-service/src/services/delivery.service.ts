// Delivery Service - Core Delivery Management
// خدمة التوصيل - إدارة التوصيل الأساسية

import { PrismaClient, Delivery, DeliveryStatus } from '@prisma/client';
import { predictionService } from './prediction.service';
import { routeOptimizerService } from './route-optimizer.service';

const prisma = new PrismaClient();

interface CreateDeliveryDTO {
  orderId: string;
  pickupAddress: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
  };
  pickupContact: {
    name: string;
    phone: string;
  };
  dropoffAddress: {
    lat: number;
    lng: number;
    address: string;
    city: string;
    country: string;
  };
  dropoffContact: {
    name: string;
    phone: string;
  };
  pickupTime?: Date;
}

interface DeliveryFilters {
  travelerId?: string;
  status?: DeliveryStatus;
  fromDate?: Date;
  toDate?: Date;
}

export class DeliveryService {
  // ==========================================
  // 📦 DELIVERY MANAGEMENT
  // ==========================================

  // Create delivery
  async createDelivery(data: CreateDeliveryDTO): Promise<Delivery> {
    // Get prediction
    const prediction = await predictionService.predictDeliveryTime(
      data.pickupAddress,
      data.dropoffAddress
    );

    // Create delivery
    const delivery = await prisma.delivery.create({
      data: {
        orderId: data.orderId,
        pickupAddress: data.pickupAddress,
        pickupContact: data.pickupContact,
        dropoffAddress: data.dropoffAddress,
        dropoffContact: data.dropoffContact,
        pickupTime: data.pickupTime,
        estimatedDelivery: prediction.estimatedArrival,
        status: 'PENDING',
        events: {
          create: {
            type: 'CREATED',
            description: 'Delivery created',
            descriptionAr: 'تم إنشاء التوصيل'
          }
        }
      }
    });

    // Save prediction
    await predictionService.savePrediction(delivery.id, prediction);

    return delivery;
  }

  // Get delivery by ID
  async getDeliveryById(id: string): Promise<Delivery | null> {
    return prisma.delivery.findUnique({
      where: { id },
      include: {
        predictions: { orderBy: { createdAt: 'desc' }, take: 1 },
        events: { orderBy: { createdAt: 'desc' } }
      }
    });
  }

  // Assign traveler
  async assignTraveler(deliveryId: string, travelerId: string): Promise<Delivery> {
    // Get delivery
    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new Error('Delivery not found');

    // Update prediction with traveler info
    const prediction = await predictionService.predictDeliveryTime(
      delivery.pickupAddress as any,
      delivery.dropoffAddress as any,
      travelerId
    );

    // Update delivery
    const updated = await prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        travelerId,
        estimatedDelivery: prediction.estimatedArrival,
        status: 'ASSIGNED',
        events: {
          create: {
            type: 'ASSIGNED',
            description: `Assigned to traveler ${travelerId}`,
            descriptionAr: `تم تعيين المسافر ${travelerId}`
          }
        }
      }
    });

    // Save new prediction
    await predictionService.savePrediction(deliveryId, prediction);

    return updated;
  }

  // Update status
  async updateStatus(
    deliveryId: string,
    status: DeliveryStatus,
    location?: { lat: number; lng: number }
  ): Promise<Delivery> {
    const now = new Date();
    const updateData: any = {
      status,
      events: {
        create: {
          type: status as any,
          description: `Status changed to ${status}`,
          descriptionAr: `تم تغيير الحالة إلى ${status}`,
          location
        }
      }
    };

    // Set timestamps based on status
    if (status === 'PICKED_UP') {
      updateData.actualPickupTime = now;
    } else if (status === 'DELIVERED') {
      updateData.actualDelivery = now;
      
      // Update prediction accuracy
      const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        include: { predictions: { orderBy: { createdAt: 'desc' }, take: 1 } }
      });
      
      if (delivery && delivery.actualPickupTime && delivery.predictions[0]) {
        const actualDuration = (now.getTime() - delivery.actualPickupTime.getTime()) / 60000;
        await predictionService.updatePredictionAccuracy(
          delivery.predictions[0].id,
          actualDuration
        );
      }
    }

    // Update location if provided
    if (location) {
      updateData.currentLocation = { ...location, timestamp: now };
      updateData.locationHistory = {
        push: { ...location, timestamp: now }
      };
    }

    return prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData
    });
  }

  // Update location
  async updateLocation(
    deliveryId: string,
    location: { lat: number; lng: number }
  ): Promise<Delivery> {
    const now = new Date();
    
    return prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        currentLocation: { ...location, timestamp: now },
        locationHistory: {
          push: { ...location, timestamp: now }
        }
      }
    });
  }

  // List deliveries
  async listDeliveries(
    filters: DeliveryFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ deliveries: Delivery[]; total: number }> {
    const where: any = {};

    if (filters.travelerId) where.travelerId = filters.travelerId;
    if (filters.status) where.status = filters.status;
    if (filters.fromDate || filters.toDate) {
      where.createdAt = {};
      if (filters.fromDate) where.createdAt.gte = filters.fromDate;
      if (filters.toDate) where.createdAt.lte = filters.toDate;
    }

    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          predictions: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      }),
      prisma.delivery.count({ where })
    ]);

    return { deliveries, total };
  }

  // ==========================================
  // 📊 ANALYTICS
  // ==========================================

  // Get delivery stats
  async getDeliveryStats(period: 'day' | 'week' | 'month'): Promise<{
    total: number;
    completed: number;
    failed: number;
    avgDeliveryTime: number;
    onTimeRate: number;
  }> {
    const startDate = new Date();
    switch (period) {
      case 'day': startDate.setDate(startDate.getDate() - 1); break;
      case 'week': startDate.setDate(startDate.getDate() - 7); break;
      case 'month': startDate.setMonth(startDate.getMonth() - 1); break;
    }

    const deliveries = await prisma.delivery.findMany({
      where: { createdAt: { gte: startDate } }
    });

    const completed = deliveries.filter(d => d.status === 'DELIVERED');
    const failed = deliveries.filter(d => d.status === 'FAILED');

    // Calculate average delivery time
    let totalTime = 0;
    let timeCount = 0;
    let onTimeCount = 0;

    for (const d of completed) {
      if (d.actualPickupTime && d.actualDelivery) {
        const duration = (d.actualDelivery.getTime() - d.actualPickupTime.getTime()) / 60000;
        totalTime += duration;
        timeCount++;

        if (d.estimatedDelivery && d.actualDelivery <= d.estimatedDelivery) {
          onTimeCount++;
        }
      }
    }

    return {
      total: deliveries.length,
      completed: completed.length,
      failed: failed.length,
      avgDeliveryTime: timeCount > 0 ? totalTime / timeCount : 0,
      onTimeRate: completed.length > 0 ? (onTimeCount / completed.length) * 100 : 0
    };
  }

  // Get traveler performance
  async updateTravelerPerformance(travelerId: string): Promise<void> {
    const deliveries = await prisma.delivery.findMany({
      where: { travelerId, status: 'DELIVERED' }
    });

    let totalTime = 0;
    let timeCount = 0;
    let onTimeCount = 0;
    let totalRating = 0;
    let ratingCount = 0;

    for (const d of deliveries) {
      if (d.actualPickupTime && d.actualDelivery) {
        const duration = (d.actualDelivery.getTime() - d.actualPickupTime.getTime()) / 60000;
        totalTime += duration;
        timeCount++;

        if (d.estimatedDelivery && d.actualDelivery <= d.estimatedDelivery) {
          onTimeCount++;
        }
      }

      if (d.rating) {
        totalRating += d.rating;
        ratingCount++;
      }
    }

    await prisma.travelerPerformance.upsert({
      where: { travelerId },
      create: {
        travelerId,
        totalDeliveries: deliveries.length,
        completedDeliveries: deliveries.length,
        onTimeDeliveries: onTimeCount,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        totalRatings: ratingCount,
        avgDeliveryTime: timeCount > 0 ? totalTime / timeCount : null,
        onTimeRate: deliveries.length > 0 ? (onTimeCount / deliveries.length) * 100 : null
      },
      update: {
        totalDeliveries: deliveries.length,
        completedDeliveries: deliveries.length,
        onTimeDeliveries: onTimeCount,
        avgRating: ratingCount > 0 ? totalRating / ratingCount : 0,
        totalRatings: ratingCount,
        avgDeliveryTime: timeCount > 0 ? totalTime / timeCount : null,
        onTimeRate: deliveries.length > 0 ? (onTimeCount / deliveries.length) * 100 : null
      }
    });
  }
}

export const deliveryService = new DeliveryService();
