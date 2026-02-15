import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface CountryValidationResult {
  isValid: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  recommendations: string[];
  complianceStatus: 'approved' | 'restricted' | 'prohibited';
}

export interface RouteValidationRequest {
  originCountry: string;
  destinationCountry: string;
  productType?: string;
}

export interface RouteValidationResult {
  isValid: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  rules: {
    id: string;
    type: string;
    severity: string;
    description: string;
    descriptionAr: string;
  }[];
  complianceStatus: 'approved' | 'restricted' | 'prohibited';
}

export interface TravelerRoute {
  id: string;
  travelerId: string;
  originCountry: string;
  destinationCountry: string;
  travelDate: Date;
  returnDate?: Date;
  isActive: boolean;
}

@Injectable()
export class CountryLayerClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.COUNTRY_LAYER_SERVICE_URL || 'http://localhost:3015/api/v1',
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      // Add JWT token if available
      const token = process.env.COUNTRY_LAYER_SERVICE_TOKEN;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Country Layer Service error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });

        if (error.response?.status === 404) {
          throw new Error('Country or rule not found');
        }

        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded for country validation');
        }

        throw new Error('Country validation service unavailable');
      }
    );
  }

  /**
   * Validate a travel route for compliance
   */
  async validateTravelRoute(originCountry: string, destinationCountry: string): Promise<RouteValidationResult> {
    try {
      const response = await this.client.post('/countries/validate-route', {
        originCountry,
        destinationCountry,
      });

      return response.data.data;
    } catch (error) {
      console.error('Error validating travel route:', error);
      throw error;
    }
  }

  /**
   * Add traveler route to country layer
   */
  async addTravelerRoute(travelerId: string, routeData: {
    originCountry: string;
    destinationCountry: string;
    travelDate: Date;
    returnDate?: Date;
  }): Promise<TravelerRoute> {
    try {
      const response = await this.client.post(`/travelers/${travelerId}/routes`, routeData);
      return response.data.data;
    } catch (error) {
      console.error('Error adding traveler route:', error);
      throw error;
    }
  }

  /**
   * Get traveler routes
   */
  async getTravelerRoutes(travelerId: string): Promise<TravelerRoute[]> {
    try {
      const response = await this.client.get(`/travelers/${travelerId}/routes`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting traveler routes:', error);
      throw error;
    }
  }

  /**
   * Remove traveler route
   */
  async removeTravelerRoute(travelerId: string, routeId: string): Promise<boolean> {
    try {
      const response = await this.client.delete(`/travelers/${travelerId}/routes/${routeId}`);
      return response.data.success;
    } catch (error) {
      console.error('Error removing traveler route:', error);
      throw error;
    }
  }

  /**
   * Check if a country is restricted for travel
   */
  async isCountryRestricted(countryCode: string): Promise<boolean> {
    try {
      const rules = await this.getCountryRules(countryCode);
      return rules.some((rule: any) => 
        rule.ruleType === 'restricted' || rule.ruleType === 'prohibited'
      );
    } catch (error) {
      console.error('Error checking country restrictions:', error);
      return false; // Assume not restricted if service is unavailable
    }
  }

  /**
   * Get compliance rules for a country
   */
  async getCountryRules(countryCode: string) {
    try {
      const response = await this.client.get(`/rules?countryCode=${countryCode}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting country rules:', error);
      throw error;
    }
  }

  /**
   * Get country information by code
   */
  async getCountryByCode(code: string) {
    try {
      const response = await this.client.get(`/countries/${code}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting country by code:', error);
      throw error;
    }
  }

  /**
   * Get all active countries
   */
  async getActiveCountries() {
    try {
      const response = await this.client.get('/countries?active=true');
      return response.data.data;
    } catch (error) {
      console.error('Error getting active countries:', error);
      throw error;
    }
  }

  /**
   * Find matching products for traveler routes
   */
  async findMatchingProducts(travelerId: string, filters?: {
    productType?: string;
    maxRiskScore?: number;
  }) {
    try {
      const routes = await this.getTravelerRoutes(travelerId);
      
      if (routes.length === 0) {
        return [];
      }

      // For each route, find matching products
      const matchingProducts = [];
      
      for (const route of routes) {
        // This would typically call the matching engine or product service
        // For now, return route information for matching
        matchingProducts.push({
          route: route,
          originCountry: route.originCountry,
          destinationCountry: route.destinationCountry,
          travelDate: route.travelDate,
          potentialMatches: [] // This would be populated by matching logic
        });
      }

      return matchingProducts;
    } catch (error) {
      console.error('Error finding matching products:', error);
      throw error;
    }
  }
}