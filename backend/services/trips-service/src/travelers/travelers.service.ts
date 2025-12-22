import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface LocationUpdate {
  lat: number;
  lon: number;
  country?: string;
  city?: string;
  airportCode?: string;
}

@Injectable()
export class TravelersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateLocation(travelerId: number, location: LocationUpdate) {
    const { lat, lon, country, city, airportCode } = location;
    
    // Use PostGIS to store location
    const locationPoint = `POINT(${lon} ${lat})`;

    try {
      // Upsert traveler location
      await this.prisma.$executeRaw`
        INSERT INTO traveler_locations (traveler_id, location, country, city, airport_code, last_updated)
        VALUES (
          ${travelerId},
          ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)::geography,
          ${country || null},
          ${city || null},
          ${airportCode || null},
          NOW()
        )
        ON CONFLICT (traveler_id) 
        DO UPDATE SET
          location = ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)::geography,
          country = ${country || null},
          city = ${city || null},
          airport_code = ${airportCode || null},
          last_updated = NOW()
      `;

      // Publish event to RabbitMQ (location updated)
      // TODO: Implement RabbitMQ publish
      await this.publishLocationEvent({
        travelerId,
        lat,
        lon,
        country,
        city,
        airportCode
      });

      return { success: true };
    } catch (error: any) {
      console.error('Update location error:', error);
      throw new Error(`Failed to update location: ${error.message}`);
    }
  }

  async getLocation(travelerId: number) {
    try {
      const result = await this.prisma.$queryRaw<any[]>`
        SELECT 
          traveler_id,
          ST_X(location::geometry) as lon,
          ST_Y(location::geometry) as lat,
          country,
          city,
          airport_code,
          last_updated
        FROM traveler_locations
        WHERE traveler_id = ${travelerId}
      `;

      if (!result || result.length === 0) {
        throw new NotFoundException('Location not found');
      }

      return {
        success: true,
        data: result[0]
      };
    } catch (error: any) {
      console.error('Get location error:', error);
      throw new Error(`Failed to get location: ${error.message}`);
    }
  }

  /**
   * Publish location update event to RabbitMQ
   */
  private async publishLocationEvent(location: any) {
    // TODO: Implement actual RabbitMQ publish
    console.log('[RabbitMQ] Location updated:', location);
    
    // This will trigger:
    // 1. Recommendation service to check nearby requests
    // 2. Matching service to find suitable orders
    // 3. Notification service to alert about opportunities
  }
}