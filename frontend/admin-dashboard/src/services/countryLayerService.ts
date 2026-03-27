import axios, { AxiosInstance } from 'axios';

export interface Country {
  code: string;
  name: string;
  nameAr: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CountryRule {
  id: string;
  countryCode: string;
  ruleType: 'import' | 'export' | 'customs' | 'restricted' | 'prohibited';
  productType?: string;
  description: string;
  descriptionAr: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceLog {
  id: string;
  productId: string;
  countryCode: string;
  ruleType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'passed' | 'failed' | 'warning';
  description: string;
  createdAt: string;
}

export interface RouteValidation {
  originCountry: string;
  destinationCountry: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  complianceStatus: 'approved' | 'restricted' | 'prohibited';
  rules: CountryRule[];
}

export interface CountryStats {
  totalCountries: number;
  activeCountries: number;
  restrictedCountries: number;
  highRiskRoutes: number;
  totalComplianceLogs: number;
  complianceRate: number;
}

export interface TravelerRoute {
  id: string;
  travelerId: string;
  originCountry: string;
  destinationCountry: string;
  travelDate: string;
  returnDate?: string;
  isActive: boolean;
  createdAt: string;
}

class CountryLayerService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_COUNTRY_LAYER_URL || 'http://localhost:3015/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
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

        if (error.response?.status === 401) {
          // Redirect to login or refresh token
          window.location.href = '/login';
        }

        throw error;
      }
    );
  }

  // Country Management
  async getAllCountries(params?: { page?: number; limit?: number; active?: boolean }): Promise<{
    success: boolean;
    data: Country[];
    pagination: any;
  }> {
    const response = await this.client.get('/countries', { params });
    return response.data;
  }

  async getCountryByCode(code: string): Promise<{
    success: boolean;
    data: Country;
  }> {
    const response = await this.client.get(`/countries/${code}`);
    return response.data;
  }

  async createCountry(countryData: Partial<Country>): Promise<{
    success: boolean;
    data: Country;
    message: string;
  }> {
    const response = await this.client.post('/countries', countryData);
    return response.data;
  }

  async updateCountry(code: string, countryData: Partial<Country>): Promise<{
    success: boolean;
    data: Country;
    message: string;
  }> {
    const response = await this.client.put(`/countries/${code}`, countryData);
    return response.data;
  }

  async deleteCountry(code: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.client.delete(`/countries/${code}`);
    return response.data;
  }

  // Compliance Rules
  async getAllRules(params?: { page?: number; limit?: number; countryCode?: string }): Promise<{
    success: boolean;
    data: CountryRule[];
    pagination: any;
  }> {
    const response = await this.client.get('/rules', { params });
    return response.data;
  }

  async getRuleById(ruleId: string): Promise<{
    success: boolean;
    data: CountryRule;
  }> {
    const response = await this.client.get(`/rules/${ruleId}`);
    return response.data;
  }

  async createRule(ruleData: Partial<CountryRule>): Promise<{
    success: boolean;
    data: CountryRule;
    message: string;
  }> {
    const response = await this.client.post('/rules', ruleData);
    return response.data;
  }

  async updateRule(ruleId: string, ruleData: Partial<CountryRule>): Promise<{
    success: boolean;
    data: CountryRule;
    message: string;
  }> {
    const response = await this.client.put(`/rules/${ruleId}`, ruleData);
    return response.data;
  }

  async deleteRule(ruleId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.client.delete(`/rules/${ruleId}`);
    return response.data;
  }

  // Route Validation
  async validateRoute(data: {
    originCountry: string;
    destinationCountry: string;
    productType?: string;
  }): Promise<{
    success: boolean;
    data: RouteValidation;
  }> {
    const response = await this.client.post('/countries/validate-route', data);
    return response.data;
  }

  async validateProductRoute(data: {
    productId: string;
    destinationCountry: string;
  }): Promise<{
    success: boolean;
    data: CountryValidationResult;
  }> {
    const response = await this.client.post('/countries/validate-product-route', data);
    return response.data;
  }

  // Compliance Logs
  async getComplianceLogs(params?: { 
    page?: number; 
    limit?: number; 
    productId?: string; 
    countryCode?: string;
    dateRange?: [string, string];
  }): Promise<{
    success: boolean;
    data: ComplianceLog[];
    pagination: any;
  }> {
    const response = await this.client.get('/compliance-logs', { params });
    return response.data;
  }

  async getComplianceLogById(logId: string): Promise<{
    success: boolean;
    data: ComplianceLog;
  }> {
    const response = await this.client.get(`/compliance-logs/${logId}`);
    return response.data;
  }

  // Traveler Routes
  async getTravelerRoutes(travelerId: string): Promise<{
    success: boolean;
    data: TravelerRoute[];
  }> {
    const response = await this.client.get(`/travelers/${travelerId}/routes`);
    return response.data;
  }

  async addTravelerRoute(travelerId: string, routeData: {
    originCountry: string;
    destinationCountry: string;
    travelDate: string;
    returnDate?: string;
  }): Promise<{
    success: boolean;
    data: TravelerRoute;
    message: string;
  }> {
    const response = await this.client.post(`/travelers/${travelerId}/routes`, routeData);
    return response.data;
  }

  async removeTravelerRoute(travelerId: string, routeId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const response = await this.client.delete(`/travelers/${travelerId}/routes/${routeId}`);
    return response.data;
  }

  // Dashboard Statistics
  async getCountryStats(): Promise<{
    success: boolean;
    data: CountryStats;
  }> {
    // This would typically be a dedicated endpoint, but for now we'll calculate from other endpoints
    try {
      const [countriesResponse, logsResponse] = await Promise.all([
        this.getAllCountries({ active: true }),
        this.getComplianceLogs({ limit: 1000 })
      ]);

      const totalCountries = countriesResponse.data.length;
      const restrictedCountries = countriesResponse.data.filter(c => !c.isActive).length;
      const complianceLogs = logsResponse.data;
      const totalComplianceLogs = complianceLogs.length;
      const passedLogs = complianceLogs.filter(log => log.status === 'passed').length;
      const complianceRate = totalComplianceLogs > 0 ? (passedLogs / totalComplianceLogs) * 100 : 0;

      return {
        success: true,
        data: {
          totalCountries: totalCountries,
          activeCountries: totalCountries - restrictedCountries,
          restrictedCountries: restrictedCountries,
          highRiskRoutes: 23, // This would come from a dedicated endpoint
          totalComplianceLogs: totalComplianceLogs,
          complianceRate: parseFloat(complianceRate.toFixed(1)),
        },
      };
    } catch (error) {
      console.error('Error fetching country stats:', error);
      throw error;
    }
  }

  // Utility methods
  async getActiveCountries(): Promise<{
    success: boolean;
    data: Country[];
    count: number;
  }> {
    const response = await this.getAllCountries({ active: true });
    return {
      ...response,
      count: response.data.length,
    };
  }

  async getRestrictedCountries(): Promise<{
    success: boolean;
    data: Country[];
    count: number;
  }> {
    const response = await this.getAllCountries();
    const restrictedCountries = response.data.filter(country => !country.isActive);
    return {
      success: true,
      data: restrictedCountries,
      count: restrictedCountries.length,
    };
  }

  async getCountryByName(name: string): Promise<{
    success: boolean;
    data: Country | null;
  }> {
    try {
      const response = await this.getAllCountries();
      const country = response.data.find(c => 
        c.name.toLowerCase().includes(name.toLowerCase()) ||
        c.nameAr.toLowerCase().includes(name.toLowerCase())
      );
      return {
        success: true,
        data: country || null,
      };
    } catch (error) {
      console.error('Error finding country by name:', error);
      return {
        success: false,
        data: null,
      };
    }
  }
}

// Export singleton instance
export const countryLayerService = new CountryLayerService();

// Export types
export type {
  Country,
  CountryRule,
  ComplianceLog,
  RouteValidation,
  CountryStats,
  TravelerRoute,
};

export default CountryLayerService;