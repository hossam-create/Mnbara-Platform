import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

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
        logger.error('Country Layer Service error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });

        if (error.response?.status === 404) {
          throw new AppError('Country or rule not found', 404);
        }

        if (error.response?.status === 429) {
          throw new AppError('Rate limit exceeded for country validation', 429);
        }

        throw new AppError('Country validation service unavailable', 503);
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
      logger.error('Error validating product route:', error);
      throw error;
    }
  }

  /**
   * Validate a general route for compliance
   */
  async validateRoute(request: RouteValidationRequest): Promise<RouteValidationResult> {
    try {
      const response = await this.client.post('/countries/validate-route', request);

      return response.data.data;
    } catch (error) {
      logger.error('Error validating route:', error);
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
      logger.error('Error getting country by code:', error);
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
      logger.error('Error getting active countries:', error);
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
      logger.error('Error getting country rules:', error);
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
      logger.error('Error checking country restrictions:', error);
      return false; // Assume not restricted if service is unavailable
    }
  }

  /**
   * Get risk assessment for a country pair
   */
  async getRiskAssessment(originCountry: string, destinationCountry: string, productType?: string) {
    try {
      const validation = await this.validateRoute({
        originCountry,
        destinationCountry,
        productType,
      });

      return {
        riskScore: validation.riskScore,
        riskLevel: validation.riskLevel,
        complianceStatus: validation.complianceStatus,
        hasRestrictions: validation.rules.length > 0,
      };
    } catch (error) {
      logger.error('Error getting risk assessment:', error);
      return {
        riskScore: 50, // Default medium risk
        riskLevel: 'medium' as const,
        complianceStatus: 'approved' as const,
        hasRestrictions: false,
      };
    }
  }
}

// Export singleton instance
export const countryLayerClient = new CountryLayerClient();