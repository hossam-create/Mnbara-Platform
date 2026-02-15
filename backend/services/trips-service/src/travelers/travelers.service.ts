import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CountryLayerClient } from './countryLayerClient';

interface LocationUpdate {
  lat: number;
  lon: number;
  country?: string;
  city?: string;
  airportCode?: string;
}

@Injectable()
export class TravelersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly countryLayerClient: CountryLayerClient
  ) {}

  async updateLocation(travelerId: number, location: LocationUpdate) {
    const { lat, lon, country, city, airportCode } = location;
    
    // Use PostGIS to store location
    const locationPoint = `POINT(${lon} ${lat})`;

    try {
      // Validate country if provided
      if (country) {
        const isRestricted = await this.countryLayerClient.isCountryRestricted(country);
        if (isRestricted) {
          throw new Error(`Travel to country ${country} is restricted`);
        }
      }

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

  /**
   * Add traveler route with country validation
   */
  async addTravelerRoute(travelerId: string, routeData: {
    originCountry: string;
    destinationCountry: string;
    travelDate: Date;
    returnDate?: Date;
  }) {
    try {
      // Validate countries
      const isOriginRestricted = await this.countryLayerClient.isCountryRestricted(routeData.originCountry);
      if (isOriginRestricted) {
        throw new Error(`Origin country ${routeData.originCountry} is restricted for travel`);
      }

      const isDestinationRestricted = await this.countryLayerClient.isCountryRestricted(routeData.destinationCountry);
      if (isDestinationRestricted) {
        throw new Error(`Destination country ${routeData.destinationCountry} is restricted for travel`);
      }

      // Validate route
      const routeValidation = await this.countryLayerClient.validateTravelRoute(
        routeData.originCountry,
        routeData.destinationCountry
      );

      if (routeValidation.complianceStatus === 'prohibited') {
        throw new Error('Travel route between countries is prohibited');
      }

      // Add route to country layer
      const route = await this.countryLayerClient.addTravelerRoute(travelerId, routeData);

      return {
        success: true,
        data: route,
        riskLevel: routeValidation.riskLevel,
        riskScore: routeValidation.riskScore
      };
    } catch (error: any) {
      console.error('Add traveler route error:', error);
      throw new Error(`Failed to add traveler route: ${error.message}`);
    }
  }

  /**
   * Get traveler routes with country information
   */
  async getTravelerRoutes(travelerId: string) {
    try {
      const routes = await this.countryLayerClient.getTravelerRoutes(travelerId);
      
      return {
        success: true,
        data: routes,
        count: routes.length
      };
    } catch (error: any) {
      console.error('Get traveler routes error:', error);
      throw new Error(`Failed to get traveler routes: ${error.message}`);
    }
  }

  /**
   * Find matching products for traveler routes
   */
  async findMatchingProductsForRoutes(travelerId: string, filters?: {
    productType?: string;
    maxRiskScore?: number;
  }) {
    try {
      const matchingProducts = await this.countryLayerClient.findMatchingProducts(travelerId, filters);
      
      return {
        success: true,
        data: matchingProducts,
        count: matchingProducts.length
      };
    } catch (error: any) {
      console.error('Find matching products error:', error);
      throw new Error(`Failed to find matching products: ${error.message}`);
    }
  }

  /**
   * Get country information
   */
  async getCountryInfo(countryCode: string) {
    try {
      const country = await this.countryLayerClient.getCountryByCode(countryCode);
      
      return {
        success: true,
        data: country
      };
    } catch (error: any) {
      console.error('Get country info error:', error);
      throw new Error(`Failed to get country info: ${error.message}`);
    }
  }

  /**
   * Get active countries for travel
   */
  async getActiveCountries() {
    try {
      const countries = await this.countryLayerClient.getActiveCountries();
      
      return {
        success: true,
        data: countries,
        count: countries.length
      };
    } catch (error: any) {
      console.error('Get active countries error:', error);
      throw new Error(`Failed to get active countries: ${error.message}`);
    }
  }
}