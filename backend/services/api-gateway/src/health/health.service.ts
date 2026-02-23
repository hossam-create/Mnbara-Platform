import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastChecked: string;
  error?: string;
}

export interface GatewayHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: ServiceHealth[];
  uptime: number;
}

const SERVICES = [
  { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001', healthPath: '/health' },
  { name: 'user-service', url: process.env.USER_SERVICE_URL || 'http://user-service:3002', healthPath: '/health' },
  { name: 'payment-service', url: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003', healthPath: '/health' },
  { name: 'product-service', url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3004', healthPath: '/health' },
  { name: 'wallet-service', url: process.env.WALLET_SERVICE_URL || 'http://wallet-service:3005', healthPath: '/health' },
  { name: 'orders-service', url: process.env.ORDERS_SERVICE_URL || 'http://orders-service:3006', healthPath: '/health' },
  { name: 'escrow-service', url: process.env.ESCROW_SERVICE_URL || 'http://escrow-service:3007', healthPath: '/health' },
  { name: 'settlement-service', url: process.env.SETTLEMENT_SERVICE_URL || 'http://settlement-service:3008', healthPath: '/health' },
  { name: 'trips-service', url: process.env.TRIPS_SERVICE_URL || 'http://trips-service:3009', healthPath: '/health' },
  { name: 'matching-service', url: process.env.MATCHING_SERVICE_URL || 'http://matching-service:3010', healthPath: '/health' },
  { name: 'notification-service', url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3011', healthPath: '/health' },
  { name: 'subscription-service', url: process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3012', healthPath: '/health' },
  { name: 'cart-service', url: process.env.CART_SERVICE_URL || 'http://cart-service:3013', healthPath: '/health' },
  { name: 'feature-management-service', url: process.env.FEATURE_MANAGEMENT_SERVICE_URL || 'http://feature-management-service:3014', healthPath: '/health' },
  { name: 'admin-service', url: process.env.ADMIN_SERVICE_URL || 'http://admin-service:3015', healthPath: '/health' },
  { name: 'country-layer-service', url: process.env.COUNTRY_LAYER_SERVICE_URL || 'http://country-layer-service:3016', healthPath: '/health' },
];

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  async checkServiceHealth(service: { name: string; url: string; healthPath: string }): Promise<ServiceHealth> {
    const start = Date.now();
    try {
      const res = await axios.get(`${service.url}${service.healthPath}`, { timeout: 5000 });
      return { name: service.name, status: res.status === 200 ? 'healthy' : 'degraded', responseTime: Date.now() - start, lastChecked: new Date().toISOString() };
    } catch (error: any) {
      return { name: service.name, status: 'unhealthy', responseTime: Date.now() - start, lastChecked: new Date().toISOString(), error: error.message };
    }
  }

  async getGatewayHealth(): Promise<GatewayHealth> {
    const services = await Promise.all(SERVICES.map(s => this.checkServiceHealth(s)));
    const unhealthy = services.filter(s => s.status === 'unhealthy').length;
    const status = unhealthy === 0 ? 'healthy' : unhealthy === services.length ? 'unhealthy' : 'degraded';
    return { status, timestamp: new Date().toISOString(), services, uptime: process.uptime() };
  }

  getApiDocs() {
    return {
      name: 'MNBARA API Gateway',
      version: '2.0.0',
      documentation: '/api-docs',
      services: SERVICES.map(s => ({ name: s.name, url: s.url })),
    };
  }
}
