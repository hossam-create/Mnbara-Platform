export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationUpdate {
  userId: string;
  userType: 'TRAVELER' | 'BUYER' | 'SELLER';
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface RouteInfo {
  travelerId: string;
  origin: string;
  destination: string;
  originLat: number;
  originLon: number;
  destLat: number;
  destLon: number;
  capacity: number;
  departureAt: Date;
}

export interface DeliveryRequestInfo {
  buyerId: string;
  productId: string;
  pickupLat: number;
  pickupLon: number;
  deliveryLat: number;
  deliveryLon: number;
  pickupAddr: string;
  deliveryAddr: string;
}

export interface NearbySearch {
  latitude: number;
  longitude: number;
  radiusKm: number;
  userType?: string;
  limit?: number;
}

export interface RouteMatch {
  routeId: string;
  travelerId: string;
  origin: string;
  destination: string;
  distance: number;
  detourDistance: number;
  matchScore: number;
  departureAt: Date;
}

export interface DistanceResult {
  distance: number; // kilometers
  duration?: number; // minutes
}

export interface GeofenceZone {
  id: string;
  name: string;
  type: string;
  centerLat: number;
  centerLon: number;
  radius: number;
  isActive: boolean;
}
