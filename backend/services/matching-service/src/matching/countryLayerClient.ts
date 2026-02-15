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
   * Validate a product route for compliance
   */
  async validateProductRoute(productId: string, destinationCountry: string): Promise<CountryValidationResult> {
    try {
      const response = await this.client.post('/countries/validate-product-route', {
        productId,
        destinationCountry,
      });

      return response.data.data;
    } catch (error) {
      console.error('Error validating product route:', error);
      throw error;
    }
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
   * Get traveler routes for matching
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
   * Check if a country is restricted for a specific product type
   */
  async isCountryRestricted(countryCode: string, productType?: string): Promise<boolean> {
    try {
      const rules = await this.getCountryRules(countryCode);
      
      if (!productType) {
        // Check for any restricted/prohibited rules
        return rules.some((rule: any) => 
          rule.ruleType === 'restricted' || rule.ruleType === 'prohibited'
        );
      }

      // Check for specific product type restrictions
      return rules.some((rule: any) => 
        rule.productType === productType && 
        (rule.ruleType === 'restricted' || rule.ruleType === 'prohibited')
      );
    } catch (error) {
      console.error('Error checking country restrictions:', error);
      return false; // Assume not restricted if service is unavailable
    }
  }

  /**
   * Get risk assessment for a country pair
   */
  async getRiskAssessment(originCountry: string, destinationCountry: string, productType?: string) {
    try {
      const validation = await this.validateTravelRoute(originCountry, destinationCountry);

      return {
        riskScore: validation.riskScore,
        riskLevel: validation.riskLevel,
        complianceStatus: validation.complianceStatus,
        hasRestrictions: validation.rules.length > 0,
        ruleCount: validation.rules.length,
        criticalRules: validation.rules.filter((rule: any) => rule.severity === 'critical').length,
      };
    } catch (error) {
      console.error('Error getting risk assessment:', error);
      return {
        riskScore: 50, // Default medium risk
        riskLevel: 'medium' as const,
        complianceStatus: 'approved' as const,
        hasRestrictions: false,
        ruleCount: 0,
        criticalRules: 0,
      };
    }
  }

  /**
   * Calculate country compatibility score for matching
   */
  calculateCountryCompatibilityScore(
    productOrigin: string,
    productDestination: string,
    travelerOrigin: string,
    travelerDestination: string
  ): number {
    let score = 100;

    // Perfect route match (both origin and destination)
    if (productOrigin === travelerOrigin && productDestination === travelerDestination) {
      score += 50;
    }
    // Partial match - same origin
    else if (productOrigin === travelerOrigin) {
      score += 25;
    }
    // Partial match - same destination
    else if (productDestination === travelerDestination) {
      score += 20;
    }
    // No direct match but traveler covers the route
    else {
      score += 10;
    }

    return Math.min(150, score); // Cap at 150
  }
}