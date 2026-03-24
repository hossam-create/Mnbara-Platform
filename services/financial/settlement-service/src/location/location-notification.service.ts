import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface NearbyLocation {
  id: string;
  name: string;
  nameAr: string;
  type: 'western_union' | 'bank' | 'exchange';
  lat: number;
  lon: number;
  distance: number;
  address: string;
  addressAr: string;
}

const WESTERN_UNION_LOCATIONS: NearbyLocation[] = [
  {
    id: 'wu-cairo-1', name: 'Western Union - Cairo Downtown', nameAr: 'ويسترن يونيون - وسط القاهرة',
    type: 'western_union', lat: 30.0444, lon: 31.2357, distance: 0,
    address: '15 Talaat Harb St, Downtown Cairo', addressAr: '15 شارع طلعت حرب، وسط القاهرة',
  },
  {
    id: 'wu-riyadh-1', name: 'Western Union - Riyadh Olaya', nameAr: 'ويسترن يونيون - الرياض العليا',
    type: 'western_union', lat: 24.7136, lon: 46.6753, distance: 0,
    address: 'Olaya Street, Riyadh', addressAr: 'شارع العليا، الرياض',
  },
  {
    id: 'wu-dubai-1', name: 'Western Union - Dubai Mall', nameAr: 'ويسترن يونيون - دبي مول',
    type: 'western_union', lat: 25.1972, lon: 55.2744, distance: 0,
    address: 'Dubai Mall, Downtown Dubai', addressAr: 'دبي مول، وسط دبي',
  },
];

@Injectable()
export class LocationNotificationService {
  private readonly logger = new Logger(LocationNotificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async findNearbyWesternUnion(lat: number, lon: number, radiusKm: number = 2): Promise<NearbyLocation[]> {
    const nearby: NearbyLocation[] = [];
    for (const location of WESTERN_UNION_LOCATIONS) {
      const distance = this.calculateDistance(lat, lon, location.lat, location.lon);
      if (distance <= radiusKm) {
        nearby.push({ ...location, distance: Math.round(distance * 100) / 100 });
      }
    }
    return nearby.sort((a, b) => a.distance - b.distance);
  }

  async checkLocationAndNotify(userId: string, lat: number, lon: number) {
    const notifications: any[] = [];
    const nearbyWU = await this.findNearbyWesternUnion(lat, lon, 0.5);

    if (nearbyWU.length > 0) {
      const nearest = nearbyWU[0];
      notifications.push({
        userId, type: 'instant_transfer',
        title: '⚡ Instant Transfer Available!', titleAr: '⚡ تحويل فوري متاح!',
        body: `Skip the queue at ${nearest.name}! Transfer instantly with Mnbara at better rates.`,
        bodyAr: `تجاوز الطابور في ${nearest.nameAr}! حوّل فوراً مع منبرة بأسعار أفضل.`,
        data: { nearbyLocation: nearest, mnbarhSavings: 0, mnbarhRate: 0, competitorRate: 0 },
      });
    }

    return notifications;
  }

  async getPriceComparison(fromCurrency: string, toCurrency: string, amount: number) {
    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrency, toCurrency, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    const mnbarhRate = exchangeRate?.rate || 1;
    const mnbarhFee = amount * 0.01;
    const mnbarhTotal = amount + mnbarhFee;
    const mnbarhReceive = amount * mnbarhRate;

    const wuRate = mnbarhRate * 0.97;
    const wuFee = amount * 0.05;
    const wuTotal = amount + wuFee;
    const wuReceive = amount * wuRate;

    const savings = wuTotal - mnbarhTotal + (mnbarhReceive - wuReceive);
    const savingsPercent = (savings / wuTotal) * 100;

    return {
      mnbarh: { fee: mnbarhFee, rate: mnbarhRate, total: mnbarhTotal, receiveAmount: mnbarhReceive },
      westernUnion: { fee: wuFee, rate: wuRate, total: wuTotal, receiveAmount: wuReceive },
      savings, savingsPercent,
    };
  }

  async generateAlternativeNotification(
    userId: string, userLat: number, userLon: number,
    fromCurrency: string, toCurrency: string, amount: number,
  ) {
    const nearbyLocations = await this.findNearbyWesternUnion(userLat, userLon);
    if (nearbyLocations.length === 0) return null;

    const nearestLocation = nearbyLocations[0];
    const westernUnionFee = amount * 0.05;
    const mnbarhFee = amount * 0.01;
    const savings = westernUnionFee - mnbarhFee;

    const exchangeRate = await this.prisma.exchangeRate.findFirst({
      where: { fromCurrency, toCurrency, isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    const mnbarhRate = exchangeRate?.rate || 1;
    const competitorRate = mnbarhRate * 0.97;

    return {
      userId, type: 'nearby_alternative',
      title: '💰 Save Money on Your Transfer!', titleAr: '💰 وفر في تحويلاتك!',
      body: `You're near ${nearestLocation.name}. Use Mnbara instead and save $${savings.toFixed(2)} on your transfer!`,
      bodyAr: `أنت بالقرب من ${nearestLocation.nameAr}. استخدم منبرة بدلاً من ذلك ووفر $${savings.toFixed(2)} في تحويلك!`,
      data: { nearbyLocation: nearestLocation, mnbarhSavings: savings, mnbarhRate, competitorRate, transferAmount: amount },
    };
  }
}
