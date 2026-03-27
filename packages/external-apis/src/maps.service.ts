/**
 * Maps & Geocoding Service
 * Integrates Google Maps, Mapbox, HERE Maps, OpenStreetMap
 */

import { BaseApiClient } from './base-client';
import { config } from './config';
import { ApiResponse, GeoLocation, RouteInfo } from './types';

export class MapsService extends BaseApiClient {
  private provider: 'google' | 'mapbox' | 'here' | 'osm';

  constructor(provider: 'google' | 'mapbox' | 'here' | 'osm' = 'google') {
    const providerConfig = config.getServiceConfig(
      provider === 'google' ? 'googleMaps' :
      provider === 'mapbox' ? 'mapbox' :
      provider === 'here' ? 'hereMaps' : 'openStreetMap'
    );

    if (!providerConfig) {
      throw new Error(`Maps provider ${provider} not configured`);
    }

    super(`maps-${provider}`, providerConfig);
    this.provider = provider;
  }

  /**
   * Geocode an address to coordinates
   */
  async geocode(address: string): Promise<ApiResponse<GeoLocation>> {
    const cacheKey = `geocode:${this.provider}:${address}`;

    switch (this.provider) {
      case 'google':
        return this.geocodeGoogle(address, cacheKey);
      case 'mapbox':
        return this.geocodeMapbox(address, cacheKey);
      case 'here':
        return this.geocodeHere(address, cacheKey);
      case 'osm':
        return this.geocodeOSM(address, cacheKey);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<ApiResponse<GeoLocation>> {
    const cacheKey = `reverse:${this.provider}:${lat},${lng}`;

    switch (this.provider) {
      case 'google':
        return this.reverseGeocodeGoogle(lat, lng, cacheKey);
      case 'mapbox':
        return this.reverseGeocodeMapbox(lat, lng, cacheKey);
      case 'here':
        return this.reverseGeocodeHere(lat, lng, cacheKey);
      case 'osm':
        return this.reverseGeocodeOSM(lat, lng, cacheKey);
      default:
        throw new Error(`Unsupported provider: ${this.provider}`);
    }
  }

  /**
   * Calculate route between two points
   */
  async getRoute(
    origin: GeoLocation,
    destination: GeoLocation
  ): Promise<ApiResponse<RouteInfo>> {
    switch (this.provider) {
      case 'google':
        return this.getRouteGoogle(origin, destination);
      case 'mapbox':
        return this.getRouteMapbox(origin, destination);
      case 'here':
        return this.getRouteHere(origin, destination);
      default:
        throw new Error(`Route calculation not supported for ${this.provider}`);
    }
  }

  /**
   * Calculate distance between two points
   */
  async getDistance(
    origin: GeoLocation,
    destination: GeoLocation
  ): Promise<ApiResponse<number>> {
    const route = await this.getRoute(origin, destination);
    
    if (route.success && route.data) {
      return {
        success: true,
        data: route.data.distance,
        timestamp: new Date(),
      };
    }

    return {
      success: false,
      error: route.error,
      timestamp: new Date(),
    };
  }

  // Google Maps implementations
  private async geocodeGoogle(address: string, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      'https://maps.googleapis.com/maps/api/geocode/json',
      { address, key: this.config.apiKey },
      cacheKey
    );

    if (response.success && response.data?.results?.[0]) {
      const result = response.data.results[0];
      return {
        success: true,
        data: {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          address: result.formatted_address,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }

  private async reverseGeocodeGoogle(lat: number, lng: number, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      'https://maps.googleapis.com/maps/api/geocode/json',
      { latlng: `${lat},${lng}`, key: this.config.apiKey },
      cacheKey
    );

    if (response.success && response.data?.results?.[0]) {
      const result = response.data.results[0];
      return {
        success: true,
        data: {
          latitude: lat,
          longitude: lng,
          address: result.formatted_address,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }

  private async getRouteGoogle(origin: GeoLocation, destination: GeoLocation): Promise<ApiResponse<RouteInfo>> {
    const response = await this.get<any>(
      'https://maps.googleapis.com/maps/api/directions/json',
      {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        key: this.config.apiKey,
      }
    );

    if (response.success && response.data?.routes?.[0]) {
      const route = response.data.routes[0];
      const leg = route.legs[0];
      
      return {
        success: true,
        data: {
          distance: leg.distance.value,
          duration: leg.duration.value,
          polyline: route.overview_polyline.points,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<RouteInfo>;
  }

  // Mapbox implementations
  private async geocodeMapbox(address: string, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      `/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
      { access_token: this.config.apiKey },
      cacheKey
    );

    if (response.success && response.data?.features?.[0]) {
      const feature = response.data.features[0];
      return {
        success: true,
        data: {
          latitude: feature.center[1],
          longitude: feature.center[0],
          address: feature.place_name,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }

  private async reverseGeocodeMapbox(lat: number, lng: number, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      `/geocoding/v5/mapbox.places/${lng},${lat}.json`,
      { access_token: this.config.apiKey },
      cacheKey
    );

    if (response.success && response.data?.features?.[0]) {
      const feature = response.data.features[0];
      return {
        success: true,
        data: {
          latitude: lat,
          longitude: lng,
          address: feature.place_name,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }

  private async getRouteMapbox(origin: GeoLocation, destination: GeoLocation): Promise<ApiResponse<RouteInfo>> {
    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
    const response = await this.get<any>(
      `/directions/v5/mapbox/driving/${coords}`,
      { access_token: this.config.apiKey, geometries: 'polyline' }
    );

    if (response.success && response.data?.routes?.[0]) {
      const route = response.data.routes[0];
      return {
        success: true,
        data: {
          distance: route.distance,
          duration: route.duration,
          polyline: route.geometry,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<RouteInfo>;
  }

  // HERE Maps implementations
  private async geocodeHere(address: string, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      '/v1/geocode',
      { q: address, apiKey: this.config.apiKey },
      cacheKey
    );

    if (response.success && response.data?.items?.[0]) {
      const item = response.data.items[0];
      return {
        success: true,
        data: {
          latitude: item.position.lat,
          longitude: item.position.lng,
          address: item.address.label,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }

  private async reverseGeocodeHere(lat: number, lng: number, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      '/v1/revgeocode',
      { at: `${lat},${lng}`, apiKey: this.config.apiKey },
      cacheKey
    );

    if (response.success && response.data?.items?.[0]) {
      const item = response.data.items[0];
      return {
        success: true,
        data: {
          latitude: lat,
          longitude: lng,
          address: item.address.label,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }

  private async getRouteHere(origin: GeoLocation, destination: GeoLocation): Promise<ApiResponse<RouteInfo>> {
    const response = await this.get<any>(
      '/v8/routes',
      {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        transportMode: 'car',
        return: 'polyline,summary',
        apiKey: this.config.apiKey,
      }
    );

    if (response.success && response.data?.routes?.[0]) {
      const route = response.data.routes[0];
      const section = route.sections[0];
      
      return {
        success: true,
        data: {
          distance: section.summary.length,
          duration: section.summary.duration,
          polyline: section.polyline,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<RouteInfo>;
  }

  // OpenStreetMap implementations
  private async geocodeOSM(address: string, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      'https://nominatim.openstreetmap.org/search',
      { q: address, format: 'json', limit: 1 },
      cacheKey
    );

    if (response.success && response.data?.[0]) {
      const result = response.data[0];
      return {
        success: true,
        data: {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }

  private async reverseGeocodeOSM(lat: number, lng: number, cacheKey: string): Promise<ApiResponse<GeoLocation>> {
    const response = await this.get<any>(
      'https://nominatim.openstreetmap.org/reverse',
      { lat, lon: lng, format: 'json' },
      cacheKey
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          latitude: lat,
          longitude: lng,
          address: response.data.display_name,
        },
        timestamp: new Date(),
      };
    }

    return response as ApiResponse<GeoLocation>;
  }
}
