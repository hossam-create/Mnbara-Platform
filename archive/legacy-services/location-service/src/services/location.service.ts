import { PrismaClient } from '@prisma/client';
import { getDistance, isPointWithinRadius } from 'geolib';
import { LocationUpdate, NearbySearch, Coordinates, DistanceResult } from '../types/location.types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class LocationService {
  async updateLocation(data: LocationUpdate) {
    try {
      const location = await prisma.location.upsert({
        where: {
          userId: data.userId
        },
        update: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          altitude: data.altitude,
          heading: data.heading,
          speed: data.speed,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          userId: data.userId,
          userType: data.userType,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          altitude: data.altitude,
          heading: data.heading,
          speed: data.speed,
          isActive: true
        }
      });

      logger.info(`Location updated for user ${data.userId}`);
      return location;
    } catch (error) {
      logger.error('Update location error:', error);
      throw new Error('Failed to update location');
    }
  }

  async getUserLocation(userId: string) {
    try {
      const location = await prisma.location.findFirst({
        where: { userId, isActive: true }
      });

      return location;
    } catch (error) {
      logger.error('Get user location error:', error);
      throw new Error('Failed to get user location');
    }
  }

  async findNearby(search: NearbySearch) {
    try {
      // Get all active locations
      const locations = await prisma.location.findMany({
        where: {
          isActive: true,
          ...(search.userType && { userType: search.userType })
        }
      });

      // Calculate distances and filter
      const nearby = locations
        .map(loc => {
          const distance = getDistance(
            { latitude: search.latitude, longitude: search.longitude },
            { latitude: loc.latitude, longitude: loc.longitude }
          ) / 1000; // Convert to km

          return {
            ...loc,
            distance
          };
        })
        .filter(loc => loc.distance <= search.radiusKm)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, search.limit || 50);

      return nearby;
    } catch (error) {
      logger.error('Find nearby error:', error);
      throw new Error('Failed to find nearby locations');
    }
  }

  async calculateDistance(from: Coordinates, to: Coordinates): Promise<DistanceResult> {
    try {
      const distanceMeters = getDistance(
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude }
      );

      const distanceKm = distanceMeters / 1000;
      
      // Estimate duration (assuming average speed of 50 km/h)
      const durationMinutes = Math.round((distanceKm / 50) * 60);

      return {
        distance: Math.round(distanceKm * 100) / 100,
        duration: durationMinutes
      };
    } catch (error) {
      logger.error('Calculate distance error:', error);
      throw new Error('Failed to calculate distance');
    }
  }

  async isWithinGeofence(latitude: number, longitude: number, zoneId: string): Promise<boolean> {
    try {
      const zone = await prisma.geofenceZone.findUnique({
        where: { id: zoneId, isActive: true }
      });

      if (!zone) {
        return false;
      }

      return isPointWithinRadius(
        { latitude, longitude },
        { latitude: zone.centerLat, longitude: zone.centerLon },
        zone.radius
      );
    } catch (error) {
      logger.error('Geofence check error:', error);
      throw new Error('Failed to check geofence');
    }
  }

  async getActiveGeofences() {
    try {
      return await prisma.geofenceZone.findMany({
        where: { isActive: true }
      });
    } catch (error) {
      logger.error('Get geofences error:', error);
      throw new Error('Failed to get geofences');
    }
  }

  async deactivateLocation(userId: string) {
    try {
      await prisma.location.updateMany({
        where: { userId },
        data: { isActive: false }
      });

      logger.info(`Location deactivated for user ${userId}`);
    } catch (error) {
      logger.error('Deactivate location error:', error);
      throw new Error('Failed to deactivate location');
    }
  }
}
