import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CrowdshipService {
  // إنشاء طلب توصيل
  async createDeliveryRequest(orderId: string, pickupLocation: any, dropoffLocation: any) {
    return await prisma.deliveryRequest.create({
      data: {
        orderId,
        pickupLocation,
        dropoffLocation,
        status: 'pending',
        reward: 50, // Default reward
      },
    });
  }

  // البحث عن مسافرين متاحين
  async findAvailableTravelers(pickupLocation: any, dropoffLocation: any) {
    return await prisma.traveler.findMany({
      where: {
        status: 'available',
        currentLocation: {
          // Simple distance check (in production use proper geospatial queries)
          latitude: { gte: pickupLocation.latitude - 0.1, lte: pickupLocation.latitude + 0.1 },
          longitude: { gte: pickupLocation.longitude - 0.1, lte: pickupLocation.longitude + 0.1 },
        },
      },
      take: 10,
    });
  }

  // قبول طلب التوصيل من قبل مسافر
  async acceptDelivery(deliveryRequestId: string, travelerId: string) {
    return await prisma.deliveryRequest.update({
      where: { id: deliveryRequestId },
      data: {
        travelerId,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });
  }

  // تحديث موقع المسافر
  async updateTravelerLocation(travelerId: string, latitude: number, longitude: number) {
    return await prisma.traveler.update({
      where: { id: travelerId },
      data: {
        currentLocation: {
          latitude,
          longitude,
        },
        lastLocationUpdate: new Date(),
      },
    });
  }

  // تأكيد التسليم
  async confirmDelivery(deliveryRequestId: string, proof: string) {
    return await prisma.deliveryRequest.update({
      where: { id: deliveryRequestId },
      data: {
        status: 'delivered',
        deliveredAt: new Date(),
        deliveryProof: proof,
      },
    });
  }

  // حساب المكافأة
  async calculateReward(distance: number, weight: number) {
    const baseReward = 50;
    const distanceReward = distance * 0.5; // 0.5 per km
    const weightReward = weight * 2; // 2 per kg
    return baseReward + distanceReward + weightReward;
  }

  // الحصول على سجل التوصيلات
  async getTravelerDeliveries(travelerId: string) {
    return await prisma.deliveryRequest.findMany({
      where: { travelerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // الحصول على إحصائيات المسافر
  async getTravelerStats(travelerId: string) {
    const deliveries = await prisma.deliveryRequest.findMany({
      where: { travelerId, status: 'delivered' },
    });

    const totalEarnings = deliveries.reduce((sum, d) => sum + (d.reward || 0), 0);
    const totalDeliveries = deliveries.length;
    const avgRating = await this.getTravelerRating(travelerId);

    return {
      totalDeliveries,
      totalEarnings,
      avgRating,
      status: 'active',
    };
  }

  // الحصول على تقييم المسافر
  async getTravelerRating(travelerId: string) {
    const ratings = await prisma.rating.findMany({
      where: { travelerId },
    });

    if (ratings.length === 0) return 5;
    const sum = ratings.reduce((acc, r) => acc + r.score, 0);
    return sum / ratings.length;
  }
}
