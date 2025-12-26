// Route Optimizer Service - AI-Powered Route Optimization
// خدمة تحسين المسارات - بالذكاء الاصطناعي

import { PrismaClient } from '@prisma/client';
import * as geolib from 'geolib';

const prisma = new PrismaClient();

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface Waypoint extends Location {
  id: string;
  type: 'pickup' | 'dropoff';
  priority?: number;
  timeWindow?: { start: Date; end: Date };
}

interface OptimizedRoute {
  waypoints: Waypoint[];
  totalDistance: number;
  totalDuration: number;
  savedDistance: number;
  savedTime: number;
}

export class RouteOptimizerService {
  // ==========================================
  // 🗺️ ROUTE OPTIMIZATION
  // ==========================================

  // Optimize route using nearest neighbor algorithm
  async optimizeRoute(
    startLocation: Location,
    waypoints: Waypoint[],
    endLocation?: Location
  ): Promise<OptimizedRoute> {
    if (waypoints.length === 0) {
      return {
        waypoints: [],
        totalDistance: 0,
        totalDuration: 0,
        savedDistance: 0,
        savedTime: 0
      };
    }

    // Calculate original distance (unoptimized)
    const originalDistance = this.calculateTotalDistance(startLocation, waypoints, endLocation);

    // Optimize using nearest neighbor
    const optimizedWaypoints = this.nearestNeighborOptimization(startLocation, waypoints);

    // Calculate optimized distance
    const optimizedDistance = this.calculateTotalDistance(startLocation, optimizedWaypoints, endLocation);

    // Estimate duration (assuming 30 km/h average speed in city)
    const avgSpeed = 30; // km/h
    const totalDuration = (optimizedDistance / avgSpeed) * 60; // in minutes

    return {
      waypoints: optimizedWaypoints,
      totalDistance: optimizedDistance,
      totalDuration,
      savedDistance: originalDistance - optimizedDistance,
      savedTime: ((originalDistance - optimizedDistance) / avgSpeed) * 60
    };
  }

  // Nearest neighbor algorithm
  private nearestNeighborOptimization(start: Location, waypoints: Waypoint[]): Waypoint[] {
    const unvisited = [...waypoints];
    const optimized: Waypoint[] = [];
    let current = start;

    while (unvisited.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const distance = this.calculateDistance(current, unvisited[i]);
        
        // Consider priority
        const priorityFactor = unvisited[i].priority ? (1 - unvisited[i].priority * 0.1) : 1;
        const adjustedDistance = distance * priorityFactor;

        if (adjustedDistance < nearestDistance) {
          nearestDistance = adjustedDistance;
          nearestIndex = i;
        }
      }

      const nearest = unvisited.splice(nearestIndex, 1)[0];
      optimized.push(nearest);
      current = nearest;
    }

    return optimized;
  }

  // Calculate distance between two points
  private calculateDistance(from: Location, to: Location): number {
    return geolib.getDistance(
      { latitude: from.lat, longitude: from.lng },
      { latitude: to.lat, longitude: to.lng }
    ) / 1000; // Convert to km
  }

  // Calculate total route distance
  private calculateTotalDistance(start: Location, waypoints: Waypoint[], end?: Location): number {
    let total = 0;
    let current = start;

    for (const waypoint of waypoints) {
      total += this.calculateDistance(current, waypoint);
      current = waypoint;
    }

    if (end) {
      total += this.calculateDistance(current, end);
    }

    return total;
  }

  // ==========================================
  // 🚗 MULTI-STOP OPTIMIZATION
  // ==========================================

  // Optimize multiple deliveries for a traveler
  async optimizeMultipleDeliveries(
    travelerId: string,
    deliveryIds: string[]
  ): Promise<{
    route: OptimizedRoute;
    deliveryOrder: string[];
  }> {
    // Get deliveries
    const deliveries = await prisma.delivery.findMany({
      where: { id: { in: deliveryIds } }
    });

    // Create waypoints from deliveries
    const waypoints: Waypoint[] = [];
    
    for (const delivery of deliveries) {
      const pickup = delivery.pickupAddress as any;
      const dropoff = delivery.dropoffAddress as any;

      waypoints.push({
        id: `${delivery.id}-pickup`,
        lat: pickup.lat,
        lng: pickup.lng,
        type: 'pickup',
        priority: 1
      });

      waypoints.push({
        id: `${delivery.id}-dropoff`,
        lat: dropoff.lat,
        lng: dropoff.lng,
        type: 'dropoff',
        priority: 2
      });
    }

    // Get traveler's current location (mock for now)
    const startLocation: Location = { lat: 30.0444, lng: 31.2357 }; // Cairo default

    // Optimize with constraint: pickup before dropoff
    const optimizedRoute = await this.optimizeWithConstraints(startLocation, waypoints);

    // Extract delivery order
    const deliveryOrder = optimizedRoute.waypoints
      .filter(w => w.type === 'pickup')
      .map(w => w.id.replace('-pickup', ''));

    return { route: optimizedRoute, deliveryOrder };
  }

  // Optimize with pickup-before-dropoff constraint
  private async optimizeWithConstraints(
    start: Location,
    waypoints: Waypoint[]
  ): Promise<OptimizedRoute> {
    const pickups = waypoints.filter(w => w.type === 'pickup');
    const dropoffs = waypoints.filter(w => w.type === 'dropoff');
    
    const optimized: Waypoint[] = [];
    const pickedUp = new Set<string>();
    let current = start;

    // Greedy approach: always pick nearest valid waypoint
    while (optimized.length < waypoints.length) {
      let best: Waypoint | null = null;
      let bestDistance = Infinity;

      // Check pickups
      for (const pickup of pickups) {
        if (optimized.includes(pickup)) continue;
        const distance = this.calculateDistance(current, pickup);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = pickup;
        }
      }

      // Check dropoffs (only if pickup is done)
      for (const dropoff of dropoffs) {
        if (optimized.includes(dropoff)) continue;
        const deliveryId = dropoff.id.replace('-dropoff', '');
        if (!pickedUp.has(deliveryId)) continue;
        
        const distance = this.calculateDistance(current, dropoff);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = dropoff;
        }
      }

      if (best) {
        optimized.push(best);
        current = best;
        if (best.type === 'pickup') {
          pickedUp.add(best.id.replace('-pickup', ''));
        }
      } else {
        break;
      }
    }

    const totalDistance = this.calculateTotalDistance(start, optimized);
    const originalDistance = this.calculateTotalDistance(start, waypoints);

    return {
      waypoints: optimized,
      totalDistance,
      totalDuration: (totalDistance / 30) * 60,
      savedDistance: originalDistance - totalDistance,
      savedTime: ((originalDistance - totalDistance) / 30) * 60
    };
  }

  // ==========================================
  // 📊 ROUTE ANALYTICS
  // ==========================================

  // Save optimized route
  async saveRoute(
    travelerId: string,
    route: OptimizedRoute,
    date: Date
  ): Promise<any> {
    return prisma.route.create({
      data: {
        travelerId,
        date,
        startLocation: route.waypoints[0] || {},
        endLocation: route.waypoints[route.waypoints.length - 1] || {},
        waypoints: route.waypoints,
        originalDistance: route.totalDistance + route.savedDistance,
        optimizedDistance: route.totalDistance,
        savedDistance: route.savedDistance,
        savedTime: route.savedTime,
        status: 'PLANNED'
      }
    });
  }

  // Get route savings stats
  async getRouteSavingsStats(travelerId?: string): Promise<{
    totalRoutes: number;
    totalDistanceSaved: number;
    totalTimeSaved: number;
    avgSavingsPercent: number;
  }> {
    const where = travelerId ? { travelerId } : {};

    const stats = await prisma.route.aggregate({
      where,
      _count: true,
      _sum: {
        savedDistance: true,
        savedTime: true,
        originalDistance: true
      }
    });

    const avgSavingsPercent = stats._sum.originalDistance 
      ? ((stats._sum.savedDistance || 0) / stats._sum.originalDistance) * 100
      : 0;

    return {
      totalRoutes: stats._count,
      totalDistanceSaved: stats._sum.savedDistance || 0,
      totalTimeSaved: stats._sum.savedTime || 0,
      avgSavingsPercent
    };
  }
}

export const routeOptimizerService = new RouteOptimizerService();
