import { PrismaClient } from '@prisma/client';
import { getDistance } from 'geolib';
import { RouteInfo, DeliveryRequestInfo, RouteMatch } from '../types/location.types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class RouteMatchingService {
  async createRoute(data: RouteInfo) {
    try {
      // Calculate distance
      const distance = getDistance(
        { latitude: data.originLat, longitude: data.originLon },
        { latitude: data.destLat, longitude: data.destLon }
      ) / 1000;

      const route = await prisma.route.create({
        data: {
          travelerId: data.travelerId,
          origin: data.origin,
          destination: data.destination,
          originLat: data.originLat,
          originLon: data.originLon,
          destLat: data.destLat,
          destLon: data.destLon,
          distance,
          capacity: data.capacity,
          departureAt: data.departureAt
        }
      });

      logger.info(`Route created: ${route.id}`);
      return route;
    } catch (error) {
      logger.error('Create route error:', error);
      throw new Error('Failed to create route');
    }
  }

  async createDeliveryRequest(data: DeliveryRequestInfo) {
    try {
      const distance = getDistance(
        { latitude: data.pickupLat, longitude: data.pickupLon },
        { latitude: data.deliveryLat, longitude: data.deliveryLon }
      ) / 1000;

      const request = await prisma.deliveryRequest.create({
        data: {
          buyerId: data.buyerId,
          productId: data.productId,
          pickupLat: data.pickupLat,
          pickupLon: data.pickupLon,
          deliveryLat: data.deliveryLat,
          deliveryLon: data.deliveryLon,
          pickupAddr: data.pickupAddr,
          deliveryAddr: data.deliveryAddr,
          distance
        }
      });

      logger.info(`Delivery request created: ${request.id}`);
      return request;
    } catch (error) {
      logger.error('Create delivery request error:', error);
      throw new Error('Failed to create delivery request');
    }
  }

  async findMatchingRoutes(requestId: string, maxDetourKm: number = 10): Promise<RouteMatch[]> {
    try {
      const request = await prisma.deliveryRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Delivery request not found');
      }

      // Get active routes
      const routes = await prisma.route.findMany({
        where: {
          status: 'ACTIVE',
          departureAt: {
            gte: new Date()
          }
        }
      });

      const matches: RouteMatch[] = [];

      for (const route of routes) {
        // Calculate distances
        const pickupToOrigin = getDistance(
          { latitude: request.pickupLat, longitude: request.pickupLon },
          { latitude: route.originLat, longitude: route.originLon }
        ) / 1000;

        const deliveryToDest = getDistance(
          { latitude: request.deliveryLat, longitude: request.deliveryLon },
          { latitude: route.destLat, longitude: route.destLon }
        ) / 1000;

        // Calculate detour
        const originalDistance = route.distance;
        const detourDistance = pickupToOrigin + request.distance + deliveryToDest - originalDistance;

        // Check if detour is acceptable
        if (detourDistance <= maxDetourKm) {
          const matchScore = 100 - (detourDistance / maxDetourKm) * 100;

          matches.push({
            routeId: route.id,
            travelerId: route.travelerId,
            origin: route.origin,
            destination: route.destination,
            distance: originalDistance,
            detourDistance: Math.round(detourDistance * 100) / 100,
            matchScore: Math.round(matchScore),
            departureAt: route.departureAt
          });
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return matches;
    } catch (error) {
      logger.error('Find matching routes error:', error);
      throw new Error('Failed to find matching routes');
    }
  }

  async matchDeliveryToRoute(requestId: string, routeId: string) {
    try {
      await prisma.deliveryRequest.update({
        where: { id: requestId },
        data: {
          status: 'MATCHED',
          matchedWith: routeId
        }
      });

      logger.info(`Delivery ${requestId} matched to route ${routeId}`);
    } catch (error) {
      logger.error('Match delivery error:', error);
      throw new Error('Failed to match delivery to route');
    }
  }

  async getRoutesByTraveler(travelerId: string) {
    try {
      return await prisma.route.findMany({
        where: { travelerId },
        orderBy: { departureAt: 'desc' }
      });
    } catch (error) {
      logger.error('Get routes error:', error);
      throw new Error('Failed to get routes');
    }
  }

  async getDeliveryRequestsByBuyer(buyerId: string) {
    try {
      return await prisma.deliveryRequest.findMany({
        where: { buyerId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Get delivery requests error:', error);
      throw new Error('Failed to get delivery requests');
    }
  }
}
