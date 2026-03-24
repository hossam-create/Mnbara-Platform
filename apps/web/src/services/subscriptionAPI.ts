import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_SUBSCRIPTION_SERVICE_URL || 'http://localhost:3025';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  plan: string;
  isActive: boolean;
  expiresAt: string;
  features: string[];
  createdAt: string;
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: string;
  currentPlan?: string;
  upgradeUrl?: string;
}

class SubscriptionAPI {
  private api;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Subscription API error:', error);
        
        if (error.response?.status === 401) {
          // Redirect to login or refresh token
          window.location.href = '/login';
        }

        throw error;
      }
    );
  }

  /**
   * Get all available subscription plans
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const response = await this.api.get('/plans');
    return response.data.data;
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(): Promise<UserSubscription | null> {
    const response = await this.api.get('/subscriptions');
    return response.data.data;
  }

  /**
   * Create new subscription
   */
  async createSubscription(plan: string, durationMonths: number = 1): Promise<UserSubscription> {
    const response = await this.api.post('/subscriptions', {
      plan,
      durationMonths
    });
    return response.data.data;
  }

  /**
   * Check feature access
   */
  async checkFeatureAccess(featureName: string): Promise<FeatureAccess> {
    const response = await this.api.post('/check-access', {
      featureName
    });
    return response.data.data;
  }

  /**
   * Record feature usage
   */
  async recordFeatureUsage(featureName: string): Promise<void> {
    await this.api.post('/feature-usage', {
      featureName
    });
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    await this.api.delete(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Get subscription statistics (admin)
   */
  async getSubscriptionStats(): Promise<any> {
    const response = await this.api.get('/admin/subscriptions');
    return response.data;
  }

  /**
   * Get feature usage statistics (admin)
   */
  async getFeatureUsageStats(startDate?: string, endDate?: string): Promise<any> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await this.api.get(`/admin/feature-usage?${params}`);
    return response.data;
  }

  /**
   * Toggle feature lock (admin)
   */
  async toggleFeatureLock(featureName: string, isLocked: boolean): Promise<void> {
    await this.api.put(`/admin/features/${featureName}/toggle`, {
      isLocked
    });
  }
}

// Export singleton instance
export const subscriptionAPI = new SubscriptionAPI();

export default SubscriptionAPI;