// Geofencing Service
// خدمة تحديد المناطق الجغرافية

import { PrismaClient, GeofenceZone as GeofenceZoneModel, GeofenceEvent } from '@prisma/client';
import { 
  GeofenceZoneData, 
  GeofenceCheckResult, 
  GeofenceEventData,
  Coordinates 
} from '../types';
import { getDistance, isPointInPolygon } from 'geolib';
import { logger } from '../utils/logger';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Zone entry cache key
const ZONE_CACHE_PREFIX = 'geofence:zone:';
const USER_ZONE_PREFIX = 'geofence:user:';

export class GeofencingService {
  /**
   * Check if a location is inside any geofence zones
   */
  async checkLocation(
    userId: string,
    latitude: number,
    longitude: number,
    accuracy?: number,
    speed?: number,
    heading?: number
  ): Promise<GeofenceCheckResult> {
    try {
      // Get all active zones
      const zones = await this.getActiveZones();
      
      const insideZones: GeofenceZoneData[] = [];
      const exitedZones: GeofenceZoneData[] = [];
      const enteredZones: GeofenceZoneData[] = [];
      const nearbyZones: GeofenceZoneData[] = [];
      const distanceToZone = new Map<string, number>();
      
      // Get user's current zone state from cache
      const userZoneState = await this.getUserZoneState(userId);
      
      for (const zone of zones) {
        const distance = this.calculateDistanceToCenter(latitude, longitude, zone);
        distanceToZone.set(zone.id, distance);
        
        // Check if inside zone (using polygon or circle)
        const isInside = zone.polygonCoords 
          ? this.isInPolygon({ latitude, longitude }, zone.polygonCoords)
          : distance <= zone.radius;
        
        if (isInside) {
          insideZones.push(zone);
          
          // Check for new entry
          if (!userZoneState.currentZoneIds.includes(zone.id)) {
            enteredZones.push(zone);
          }
        } else {
          // Check if exited
          if (userZoneState.currentZoneIds.includes(zone.id)) {
            exitedZones.push(zone);
          }
          
          // Check for nearby zones (within 2x radius)
          if (distance <= zone.radius * 2) {
            nearbyZones.push(zone);
          }
        }
      }
      
      // Determine current zone (prioritize airport zones, then by proximity)
      const currentZone = this.determineCurrentZone(insideZones, userZoneState);
      
      // Update user zone state in cache
      await this.updateUserZoneState(userId, {
        currentZoneIds: insideZones.map(z => z.id),
        currentZoneId: currentZone?.id,
        latitude,
        longitude,
        lastUpdate: new Date()
      });
      
      // Handle zone events
      if (enteredZones.length > 0 || exitedZones.length > 0) {
        await this.handleZoneEvents(userId, enteredZones, exitedZones, currentZone, {
          latitude,
          longitude,
          accuracy,
          speed,
          heading
        });
      }
      
      return {
        insideZones,
        exitedZones,
        enteredZones,
        nearbyZones,
        currentZone,
        distanceToZone
      };
    } catch (error) {
      logger.error('Geofence check error:', error);
      return {
        insideZones: [],
        exitedZones: [],
        enteredZones: [],
        nearbyZones: [],
        distanceToZone: new Map()
      };
    }
  }

  /**
   * Get active geofence zones
   */
  private async getActiveZones(): Promise<GeofenceZoneData[]> {
    try {
      const zones = await prisma.geofenceZone.findMany({
        where: {
          isActive: true
        }
      });
      
      return zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        code: zone.code,
        zoneType: zone.zoneType,
        centerLatitude: zone.centerLatitude,
        centerLongitude: zone.centerLongitude,
        radius: zone.radius,
        polygonCoords: zone.polygonCoords as Coordinates[] | undefined,
        airportCode: zone.airportCode || undefined,
        airportName: zone.airportName || undefined,
        isActive: zone.isActive,
        triggerOnEntry: zone.triggerOnEntry,
        triggerOnExit: zone.triggerOnExit,
        alertTypes: zone.alertTypes
      }));
    } catch (error) {
      logger.error('Error fetching geofence zones:', error);
      return [];
    }
  }

  /**
   * Calculate distance from point to zone center
   */
  private calculateDistanceToCenter(
    lat: number, 
    lng: number, 
    zone: GeofenceZoneData
  ): number {
    const distanceMeters = getDistance(
      { latitude: lat, longitude: lng },
      { latitude: zone.centerLatitude, longitude: zone.centerLongitude }
    );
    return distanceMeters;
  }

  /**
   * Check if point is in polygon
   */
  private isInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
    return isPointInPolygon(
      { latitude: point.latitude, longitude: point.longitude },
      polygon.map(p => ({ latitude: p.latitude, longitude: p.longitude }))
    );
  }

  /**
   * Get user's current zone state from cache
   */
  private async getUserZoneState(userId: string): Promise<{
    currentZoneIds: string[];
    currentZoneId?: string;
    latitude?: number;
    longitude?: number;
    lastUpdate?: Date;
  }> {
    try {
      const data = await redis.get(`${USER_ZONE_PREFIX}${userId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      logger.warn('Redis error getting user zone state:', error);
    }
    return { currentZoneIds: [] };
  }

  /**
   * Update user zone state in cache
   */
  private async updateUserZoneState(
    userId: string, 
    state: {
      currentZoneIds: string[];
      currentZoneId?: string;
      latitude?: number;
      longitude?: number;
      lastUpdate?: Date;
    }
  ): Promise<void> {
    try {
      await redis.setex(
        `${USER_ZONE_PREFIX}${userId}`,
        3600, // 1 hour TTL
        JSON.stringify(state)
      );
    } catch (error) {
      logger.warn('Redis error updating user zone state:', error);
    }
  }

  /**
   * Determine current zone (prioritize by zone type and proximity)
   */
  private determineCurrentZone(
    insideZones: GeofenceZoneData[],
    userZoneState: { currentZoneId?: string }
  ): GeofenceZoneData | undefined {
    if (insideZones.length === 0) return undefined;
    
    // If user was already in a zone, prefer that one
    if (userZoneState.currentZoneId) {
      const previousZone = insideZones.find(z => z.id === userZoneState.currentZoneId);
      if (previousZone) return previousZone;
    }
    
    // Prioritize airport zones, then by type
    const zonePriority = ['AIRPORT', 'DELIVERY_ZONE', 'PROMOTIONAL_ZONE', 'HOME_ZONE', 'OFFICE_ZONE', 'CUSTOM'];
    
    return insideZones.sort((a, b) => {
      const priorityA = zonePriority.indexOf(a.zoneType);
      const priorityB = zonePriority.indexOf(b.zoneType);
      return (priorityA === -1 ? 99 : priorityA) - (priorityB === -1 ? 99 : priorityB);
    })[0];
  }

  /**
   * Handle zone entry/exit events
   */
  private async handleZoneEvents(
    userId: string,
    enteredZones: GeofenceZoneData[],
    exitedZones: GeofenceZoneData[],
    currentZone: GeofenceZoneData | undefined,
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
    }
  ): Promise<void> {
    const events: GeofenceEventData[] = [];
    
    // Get previous zone for travel detection
    const userZoneState = await this.getUserZoneState(userId);
    
    for (const zone of enteredZones) {
      if (zone.triggerOnEntry) {
        events.push({
          zoneId: zone.id,
          zoneName: zone.name,
          eventType: 'ENTER',
          userId,
          latitude: location.latitude,
          longitude: location.longitude,
          distanceFromCenter: this.calculateDistanceToCenter(location.latitude, location.longitude, zone),
          speed: location.speed,
          heading: location.heading,
          previousZoneId: userZoneState.currentZoneId,
          nextZoneId: currentZone?.id
        });
      }
    }
    
    for (const zone of exitedZones) {
      if (zone.triggerOnExit) {
        events.push({
          zoneId: zone.id,
          zoneName: zone.name,
          eventType: 'EXIT',
          userId,
          latitude: location.latitude,
          longitude: location.longitude,
          distanceFromCenter: 0,
          speed: location.speed,
          heading: location.heading,
          previousZoneId: zone.id
        });
      }
    }
    
    // Check for travel between zones
    if (events.length > 0 && userZoneState.currentZoneId && events[0].eventType === 'ENTER') {
      const prevZone = await prisma.geofenceZone.findUnique({
        where: { id: userZoneState.currentZoneId }
      });
      
      if (prevZone && events[0].zoneId !== userZoneState.currentZoneId) {
        // Calculate travel time and distance
        const travelDistance = this.calculateTravelDistance(
          userZoneState.latitude!,
          userZoneState.longitude!,
          location.latitude,
          location.longitude
        );
        
        events[0].travelDistance = travelDistance;
        // Travel time would be calculated from the last update timestamp
      }
    }
    
    // Save events to database
    for (const event of events) {
      await this.saveGeofenceEvent(event);
    }
  }

  /**
   * Calculate travel distance between two points
   */
  private calculateTravelDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const distanceMeters = getDistance(
      { latitude: lat1, longitude: lng1 },
      { latitude: lat2, longitude: lng2 }
    );
    return distanceMeters / 1000; // Convert to km
  }

  /**
   * Save geofence event to database
   */
  private async saveGeofenceEvent(event: GeofenceEventData): Promise<void> {
    try {
      const zone = await prisma.geofenceZone.findUnique({
        where: { id: event.zoneId }
      });
      
      if (zone) {
        await prisma.geofenceEvent.create({
          data: {
            zoneId: event.zoneId,
            userId: event.userId,
            eventType: event.eventType as any,
            latitude: event.latitude,
            longitude: event.longitude,
            accuracy: event.distanceFromCenter,
            distanceFromCenter: event.distanceFromCenter,
            speed: event.speed,
            heading: event.heading,
            previousZoneId: event.previousZoneId,
            nextZoneId: event.nextZoneId,
            travelDistance: event.travelDistance,
            travelTime: event.travelTime,
            durationInZone: event.durationInZone
          }
        });
        
        logger.info(`Geofence event: ${event.eventType} - ${event.zoneName} for user ${event.userId}`);
        
        // Trigger notifications if configured
        if (zone.notifyAdmins || zone.notifyUsers) {
          await this.sendZoneNotifications(event, zone);
        }
      }
    } catch (error) {
      logger.error('Error saving geofence event:', error);
    }
  }

  /**
   * Send notifications for zone events
   */
  private async sendZoneNotifications(
    event: GeofenceEventData,
    zone: GeofenceZoneModel
  ): Promise<void> {
    // This would integrate with the notification service
    const notificationData = {
      type: `GEOFENCE_${event.eventType}`,
      zoneName: zone.name,
      zoneType: zone.zoneType,
      airportCode: zone.airportCode,
      latitude: event.latitude,
      longitude: event.longitude,
      distance: event.distanceFromCenter,
      speed: event.speed,
      travelDistance: event.travelDistance,
      notifyAdmins: zone.notifyAdmins,
      notifyUsers: zone.notifyUsers
    };
    
    // Log for now - actual notification would be sent via message queue
    logger.info('Zone notification triggered:', notificationData);
  }

  /**
   * Create a new geofence zone
   */
  async createZone(data: Partial<GeofenceZoneModel>): Promise<GeofenceZoneModel> {
    return await prisma.geofenceZone.create({
      data: {
        name: data.name || 'New Zone',
        code: data.code || `ZONE_${Date.now()}`,
        zoneType: data.zoneType || 'CUSTOM',
        centerLatitude: data.centerLatitude || 0,
        centerLongitude: data.centerLongitude || 0,
        radius: data.radius || 1000,
        polygonCoords: data.polygonCoords,
        airportCode: data.airportCode,
        airportName: data.airportName,
        isAirport: data.isAirport || false,
        triggerOnEntry: data.triggerOnEntry ?? true,
        triggerOnExit: data.triggerOnExit ?? true,
        alertTypes: data.alertTypes || ['ENTRY', 'EXIT'],
        notifyAdmins: data.notifyAdmins ?? true,
        notifyUsers: data.notifyUsers ?? true
      }
    });
  }

  /**
   * Update a geofence zone
   */
  async updateZone(id: string, data: Partial<GeofenceZoneModel>): Promise<GeofenceZoneModel> {
    return await prisma.geofenceZone.update({
      where: { id },
      data
    });
  }

  /**
   * Delete a geofence zone
   */
  async deleteZone(id: string): Promise<void> {
    await prisma.geofenceZone.delete({ where: { id } });
  }

  /**
   * List all geofence zones
   */
  async listZones(activeOnly = false): Promise<GeofenceZoneModel[]> {
    return await prisma.geofenceZone.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Get zones by airport code
   */
  async getZonesByAirport(airportCode: string): Promise<GeofenceZoneModel[]> {
    return await prisma.geofenceZone.findMany({
      where: {
        isAirport: true,
        airportCode: airportCode.toUpperCase()
      }
    });
  }
}

export const geofencingService = new GeofencingService();
