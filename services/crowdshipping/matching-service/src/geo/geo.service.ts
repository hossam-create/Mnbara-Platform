import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface NearbyListing {
  listingId: number;
  title: string;
  distanceKm: number;
}

export interface NearbyTraveler {
  travelerId: number;
  distanceKm: number;
  lastSeen: Date;
}

export interface NearbyTrip {
  tripId: number;
  travelerId: number;
  originCity: string;
  destCity: string;
  departureDate: Date;
  distanceKm: number;
}

export interface TripMatch {
  tripId: number;
  travelerId: number;
  pickupDistanceKm: number;
  deliveryDistanceKm: number;
  totalDistanceKm: number;
  departureDate: Date;
  arrivalDate: Date;
  pricePerKg: number;
  availableWeight: number;
}

@Injectable()
export class GeoService {
  private readonly logger = new Logger(GeoService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Find active listings within a radius from a point
   * Uses PostGIS ST_DWithin for efficient spatial queries
   */
  async findListingsWithinRadius(
    center: GeoPoint,
    radiusKm: number,
  ): Promise<NearbyListing[]> {
    try {
      const results = await this.prisma.$queryRaw<NearbyListing[]>`
        SELECT 
          l.id as "listingId",
          l.title,
          ST_Distance(
            l.location::geography,
            ST_SetSRID(ST_MakePoint(${center.lon}, ${center.lat}), 4326)::geography
          ) / 1000 AS "distanceKm"
        FROM "Listing" l
        WHERE l.location IS NOT NULL
          AND l.status = 'ACTIVE'
          AND ST_DWithin(
            l.location::geography,
            ST_SetSRID(ST_MakePoint(${center.lon}, ${center.lat}), 4326)::geography,
            ${radiusKm * 1000}
          )
        ORDER BY "distanceKm"
      `;
      return results;
    } catch (error) {
      this.logger.error('Error finding listings within radius', error);
      // Fallback to non-PostGIS query if extension not available
      return this.findListingsWithinRadiusFallback(center, radiusKm);
    }
  }

  /**
   * Fallback method using Haversine formula when PostGIS is not available
   */
  private async findListingsWithinRadiusFallback(
    center: GeoPoint,
    radiusKm: number,
  ): Promise<NearbyListing[]> {
    const listings = await this.prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
      },
    });

    return listings
      .map((listing) => ({
        listingId: listing.id,
        title: listing.title,
        distanceKm: this.haversineDistance(
          center.lat,
          center.lon,
          listing.latitude!,
          listing.longitude!,
        ),
      }))
      .filter((l) => l.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Find travelers within a radius from a point
   */
  async findTravelersWithinRadius(
    center: GeoPoint,
    radiusKm: number,
  ): Promise<NearbyTraveler[]> {
    try {
      const results = await this.prisma.$queryRaw<NearbyTraveler[]>`
        SELECT 
          tl."travelerId" as "travelerId",
          ST_Distance(
            tl.location::geography,
            ST_SetSRID(ST_MakePoint(${center.lon}, ${center.lat}), 4326)::geography
          ) / 1000 AS "distanceKm",
          tl."lastSeenAt" as "lastSeen"
        FROM "TravelerLocation" tl
        WHERE tl.location IS NOT NULL
          AND ST_DWithin(
            tl.location::geography,
            ST_SetSRID(ST_MakePoint(${center.lon}, ${center.lat}), 4326)::geography,
            ${radiusKm * 1000}
          )
        ORDER BY "distanceKm"
      `;
      return results;
    } catch (error) {
      this.logger.error('Error finding travelers within radius', error);
      return this.findTravelersWithinRadiusFallback(center, radiusKm);
    }
  }

  /**
   * Fallback for traveler search
   */
  private async findTravelersWithinRadiusFallback(
    center: GeoPoint,
    radiusKm: number,
  ): Promise<NearbyTraveler[]> {
    const travelers = await this.prisma.travelerLocation.findMany({
      select: {
        travelerId: true,
        latitude: true,
        longitude: true,
        lastSeenAt: true,
      },
    });

    return travelers
      .map((t) => ({
        travelerId: t.travelerId,
        distanceKm: this.haversineDistance(
          center.lat,
          center.lon,
          t.latitude,
          t.longitude,
        ),
        lastSeen: t.lastSeenAt,
      }))
      .filter((t) => t.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  /**
   * Find trips with origin near a point
   */
  async findTripsNearOrigin(
    center: GeoPoint,
    radiusKm: number,
  ): Promise<NearbyTrip[]> {
    try {
      const results = await this.prisma.$queryRaw<NearbyTrip[]>`
        SELECT 
          t.id as "tripId",
          t."travelerId" as "travelerId",
          t."originCity" as "originCity",
          t."destCity" as "destCity",
          t."departureDate" as "departureDate",
          ST_Distance(
            t.origin_location::geography,
            ST_SetSRID(ST_MakePoint(${center.lon}, ${center.lat}), 4326)::geography
          ) / 1000 AS "distanceKm"
        FROM "Trip" t
        WHERE t.origin_location IS NOT NULL
          AND t.status = 'ACTIVE'
          AND t."departureDate" > NOW()
          AND ST_DWithin(
            t.origin_location::geography,
            ST_SetSRID(ST_MakePoint(${center.lon}, ${center.lat}), 4326)::geography,
            ${radiusKm * 1000}
          )
        ORDER BY "distanceKm", t."departureDate"
      `;
      return results;
    } catch (error) {
      this.logger.error('Error finding trips near origin', error);
      return [];
    }
  }

  /**
   * Match an order with compatible trips based on proximity
   */
  async matchOrderWithTrips(
    orderId: number,
    maxPickupRadiusKm: number = 50,
    maxDeliveryRadiusKm: number = 50,
  ): Promise<TripMatch[]> {
    try {
      const results = await this.prisma.$queryRaw<TripMatch[]>`
        SELECT * FROM match_orders_with_trips(
          ${orderId},
          ${maxPickupRadiusKm},
          ${maxDeliveryRadiusKm}
        )
      `;
      return results;
    } catch (error) {
      this.logger.error('Error matching order with trips', error);
      return [];
    }
  }

  /**
   * Update location geometry for a listing
   */
  async updateListingLocation(
    listingId: number,
    lat: number,
    lon: number,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE "Listing"
        SET 
          latitude = ${lat},
          longitude = ${lon},
          location = ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)
        WHERE id = ${listingId}
      `;
    } catch (error) {
      this.logger.error('Error updating listing location', error);
      // Fallback without PostGIS
      await this.prisma.listing.update({
        where: { id: listingId },
        data: { latitude: lat, longitude: lon },
      });
    }
  }

  /**
   * Update traveler location with geometry
   */
  async updateTravelerLocation(
    travelerId: number,
    lat: number,
    lon: number,
    country?: string,
    airportCode?: string,
  ): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO "TravelerLocation" ("travelerId", latitude, longitude, country, "airportCode", location, "lastSeenAt", "createdAt", "updatedAt")
        VALUES (
          ${travelerId},
          ${lat},
          ${lon},
          ${country || null},
          ${airportCode || null},
          ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326),
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT ("travelerId") DO UPDATE SET
          latitude = ${lat},
          longitude = ${lon},
          country = COALESCE(${country || null}, "TravelerLocation".country),
          "airportCode" = COALESCE(${airportCode || null}, "TravelerLocation"."airportCode"),
          location = ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326),
          "lastSeenAt" = NOW(),
          "updatedAt" = NOW()
      `;
    } catch (error) {
      this.logger.error('Error updating traveler location', error);
      // Fallback without PostGIS
      await this.prisma.travelerLocation.upsert({
        where: { travelerId },
        create: {
          travelerId,
          latitude: lat,
          longitude: lon,
          country,
          airportCode,
        },
        update: {
          latitude: lat,
          longitude: lon,
          country,
          airportCode,
          lastSeenAt: new Date(),
        },
      });
    }
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
