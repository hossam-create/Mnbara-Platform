import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// قائمة مكاتب Western Union و البنوك الشائعة
// List of Western Union offices and common banks
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

interface LocationNotification {
  userId: string;
  type: 'nearby_alternative' | 'better_rate' | 'instant_transfer';
  title: string;
  titleAr: string;
  body: string;
  bodyAr: string;
  data: {
    nearbyLocation: NearbyLocation;
    mnbaraSavings: number;
    mnbaraRate: number;
    competitorRate: number;
    transferAmount?: number;
  };
}

// بيانات تجريبية لمكاتب Western Union
// Sample Western Union office data
const WESTERN_UNION_LOCATIONS: NearbyLocation[] = [
  {
    id: 'wu-cairo-1',
    name: 'Western Union - Cairo Downtown',
    nameAr: 'ويسترن يونيون - وسط القاهرة',
    type: 'western_union',
    lat: 30.0444,
    lon: 31.2357,
    distance: 0,
    address: '15 Talaat Harb St, Downtown Cairo',
    addressAr: '15 شارع طلعت حرب، وسط القاهرة'
  },
  {
    id: 'wu-riyadh-1',
    name: 'Western Union - Riyadh Olaya',
    nameAr: 'ويسترن يونيون - الرياض العليا',
    type: 'western_union',
    lat: 24.7136,
    lon: 46.6753,
    distance: 0,
    address: 'Olaya Street, Riyadh',
    addressAr: 'شارع العليا، الرياض'
  },
  {
    id: 'wu-dubai-1',
    name: 'Western Union - Dubai Mall',
    nameAr: 'ويسترن يونيون - دبي مول',
    type: 'western_union',
    lat: 25.1972,
    lon: 55.2744,
    distance: 0,
    address: 'Dubai Mall, Downtown Dubai',
    addressAr: 'دبي مول، وسط دبي'
  }
];

export class LocationNotificationService {
  
  /**
   * حساب المسافة بين نقطتين (Haversine formula)
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
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

  /**
   * البحث عن مكاتب Western Union القريبة
   * Find nearby Western Union offices
   */
  async findNearbyWesternUnion(lat: number, lon: number, radiusKm: number = 2): Promise<NearbyLocation[]> {
    const nearby: NearbyLocation[] = [];
    
    for (const location of WESTERN_UNION_LOCATIONS) {
      const distance = this.calculateDistance(lat, lon, location.lat, location.lon);
      if (distance <= radiusKm) {
        nearby.push({
          ...location,
          distance: Math.round(distance * 100) / 100
        });
      }
    }
    
    return nearby.sort((a, b) => a.distance - b.distance);
  }

  /**
   * إنشاء إشعار بديل أفضل
   * Generate better alternative notification
   */
  async generateAlternativeNotification(
    userId: string,
    userLat: number,
    userLon: number,
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Promise<LocationNotification | null> {
    // البحث عن مكاتب قريبة
    const nearbyLocations = await this.findNearbyWesternUnion(userLat, userLon);
    
    if (nearbyLocations.length === 0) {
      return null;
    }

    const nearestLocation = nearbyLocations[0];

    // حساب الفرق في الأسعار
    // Western Union typically charges 5-7% fees
    const westernUnionFee = amount * 0.05;
    const mnbaraFee = amount * 0.01; // 1% fee
    const savings = westernUnionFee - mnbaraFee;

    // الحصول على سعر الصرف من Mnbara
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        isActive: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const mnbaraRate = exchangeRate?.rate || 1;
    // Western Union typically has 2-3% worse exchange rate
    const competitorRate = mnbaraRate * 0.97;

    return {
      userId,
      type: 'nearby_alternative',
      title: '💰 Save Money on Your Transfer!',
      titleAr: '💰 وفر في تحويلاتك!',
      body: `You're near ${nearestLocation.name}. Use Mnbara instead and save $${savings.toFixed(2)} on your transfer!`,
      bodyAr: `أنت بالقرب من ${nearestLocation.nameAr}. استخدم منبرة بدلاً من ذلك ووفر $${savings.toFixed(2)} في تحويلك!`,
      data: {
        nearbyLocation: nearestLocation,
        mnbaraSavings: savings,
        mnbaraRate,
        competitorRate,
        transferAmount: amount
      }
    };
  }

  /**
   * التحقق من موقع المستخدم وإرسال إشعارات
   * Check user location and send notifications
   */
  async checkLocationAndNotify(
    userId: string,
    lat: number,
    lon: number
  ): Promise<LocationNotification[]> {
    const notifications: LocationNotification[] = [];

    // البحث عن مكاتب Western Union القريبة
    const nearbyWU = await this.findNearbyWesternUnion(lat, lon, 0.5); // 500m radius

    if (nearbyWU.length > 0) {
      const nearest = nearbyWU[0];
      
      // إشعار بديل فوري
      notifications.push({
        userId,
        type: 'instant_transfer',
        title: '⚡ Instant Transfer Available!',
        titleAr: '⚡ تحويل فوري متاح!',
        body: `Skip the queue at ${nearest.name}! Transfer instantly with Mnbara at better rates.`,
        bodyAr: `تجاوز الطابور في ${nearest.nameAr}! حوّل فوراً مع منبرة بأسعار أفضل.`,
        data: {
          nearbyLocation: nearest,
          mnbaraSavings: 0,
          mnbaraRate: 0,
          competitorRate: 0
        }
      });
    }

    return notifications;
  }

  /**
   * الحصول على مقارنة الأسعار
   * Get price comparison
   */
  async getPriceComparison(
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Promise<{
    mnbara: { fee: number; rate: number; total: number; receiveAmount: number };
    westernUnion: { fee: number; rate: number; total: number; receiveAmount: number };
    savings: number;
    savingsPercent: number;
  }> {
    // الحصول على سعر Mnbara
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency,
        toCurrency,
        isActive: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const mnbaraRate = exchangeRate?.rate || 1;
    const mnbaraFee = amount * 0.01; // 1%
    const mnbaraTotal = amount + mnbaraFee;
    const mnbaraReceive = amount * mnbaraRate;

    // تقدير Western Union
    const wuRate = mnbaraRate * 0.97; // 3% worse rate
    const wuFee = amount * 0.05; // 5% fee
    const wuTotal = amount + wuFee;
    const wuReceive = amount * wuRate;

    const savings = wuTotal - mnbaraTotal + (mnbaraReceive - wuReceive);
    const savingsPercent = (savings / wuTotal) * 100;

    return {
      mnbara: {
        fee: mnbaraFee,
        rate: mnbaraRate,
        total: mnbaraTotal,
        receiveAmount: mnbaraReceive
      },
      westernUnion: {
        fee: wuFee,
        rate: wuRate,
        total: wuTotal,
        receiveAmount: wuReceive
      },
      savings,
      savingsPercent
    };
  }
}

export const locationNotificationService = new LocationNotificationService();
