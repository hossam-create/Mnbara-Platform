import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';
import { logger } from '../utils/logger';

const locationService = new LocationService();

export class LocationController {
  async updateLocation(req: Request, res: Response) {
    try {
      const { userId, userType, latitude, longitude, accuracy, altitude, heading, speed } = req.body;

      if (!userId || !userType || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const location = await locationService.updateLocation({
        userId,
        userType,
        latitude,
        longitude,
        accuracy,
        altitude,
        heading,
        speed
      });

      res.json(location);
    } catch (error: any) {
      logger.error('Update location error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getUserLocation(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const location = await locationService.getUserLocation(userId);

      if (!location) {
        return res.status(404).json({ error: 'Location not found' });
      }

      res.json(location);
    } catch (error: any) {
      logger.error('Get user location error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async findNearby(req: Request, res: Response) {
    try {
      const { latitude, longitude, radiusKm, userType, limit } = req.query;

      if (!latitude || !longitude || !radiusKm) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const nearby = await locationService.findNearby({
        latitude: parseFloat(latitude as string),
        longitude: parseFloat(longitude as string),
        radiusKm: parseFloat(radiusKm as string),
        userType: userType as string,
        limit: limit ? parseInt(limit as string) : undefined
      });

      res.json({ results: nearby, count: nearby.length });
    } catch (error: any) {
      logger.error('Find nearby error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async calculateDistance(req: Request, res: Response) {
    try {
      const { fromLat, fromLon, toLat, toLon } = req.query;

      if (!fromLat || !fromLon || !toLat || !toLon) {
        return res.status(400).json({ error: 'Missing coordinates' });
      }

      const result = await locationService.calculateDistance(
        { latitude: parseFloat(fromLat as string), longitude: parseFloat(fromLon as string) },
        { latitude: parseFloat(toLat as string), longitude: parseFloat(toLon as string) }
      );

      res.json(result);
    } catch (error: any) {
      logger.error('Calculate distance error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async checkGeofence(req: Request, res: Response) {
    try {
      const { latitude, longitude, zoneId } = req.query;

      if (!latitude || !longitude || !zoneId) {
        return res.status(400).json({ error: 'Missing parameters' });
      }

      const isWithin = await locationService.isWithinGeofence(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        zoneId as string
      );

      res.json({ isWithin });
    } catch (error: any) {
      logger.error('Check geofence error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getGeofences(req: Request, res: Response) {
    try {
      const geofences = await locationService.getActiveGeofences();
      res.json(geofences);
    } catch (error: any) {
      logger.error('Get geofences error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async deactivateLocation(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      await locationService.deactivateLocation(userId);

      res.json({ message: 'Location deactivated' });
    } catch (error: any) {
      logger.error('Deactivate location error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}
