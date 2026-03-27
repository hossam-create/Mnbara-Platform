import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { config } from '../config';

interface ProxyOptions {
  method: string;
  path: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

interface RequestMetadata {
  startTime: Date;
}

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: RequestMetadata;
  }
}

export class HttpClient {
  private clients: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    const services = [
      { name: 'auth', baseURL: config.authServiceUrl },
      { name: 'user', baseURL: config.userServiceUrl },
      { name: 'order', baseURL: config.orderServiceUrl },
      { name: 'payment', baseURL: config.paymentServiceUrl },
      { name: 'delivery', baseURL: config.deliveryServiceUrl },
    ];

    services.forEach(({ name, baseURL }) => {
      const client = axios.create({
        baseURL,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Request interceptor
      client.interceptors.request.use(
        (reqConfig) => {
          (reqConfig as AxiosRequestConfig & { metadata?: RequestMetadata }).metadata = { startTime: new Date() };
          return reqConfig;
        },
        (error) => Promise.reject(error)
      );

      // Response interceptor
      client.interceptors.response.use(
        (response) => {
          const config = response.config;
          const metadata = (config as AxiosRequestConfig & { metadata?: RequestMetadata }).metadata;
          const duration = metadata ? new Date().getTime() - metadata.startTime.getTime() : 0;
          console.log(`[${response.status}] ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`);
          return response;
        },
        (error: AxiosError) => {
          if (error.response) {
            const config = error.config;
            if (config) {
              const metadata = (config as AxiosRequestConfig & { metadata?: RequestMetadata }).metadata;
              const duration = metadata ? new Date().getTime() - metadata.startTime.getTime() : 0;
              console.error(`[${error.response.status}] ${config.method?.toUpperCase()} ${config.url} - ${duration}ms`);
            }
          }
          return Promise.reject(error);
        }
      );

      this.clients.set(name, client);
    });
  }

  getClient(serviceName: string): AxiosInstance | undefined {
    return this.clients.get(serviceName);
  }

  async proxy(serviceName: string, options: ProxyOptions): Promise<{
    status: number;
    data: unknown;
    headers: Record<string, string>;
  }> {
    const client = this.clients.get(serviceName);
    if (!client) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    const { method, path, body, headers, query } = options;

    try {
      const response = await client.request({
        method,
        url: path,
        data: body,
        params: query,
        headers,
      });

      return {
        status: response.status,
        data: response.data,
        headers: this.extractHeaders(response.headers),
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          return {
            status: error.response.status,
            data: error.response.data,
            headers: this.extractHeaders(error.response.headers),
          };
        }
        if (error.request) {
          throw new Error(`Service ${serviceName} is unreachable`);
        }
      }
      throw error;
    }
  }

  private extractHeaders(headers: unknown): Record<string, string> {
    const result: Record<string, string> = {};
    if (headers && typeof headers === 'object') {
      Object.entries(headers as Record<string, unknown>).forEach(([key, value]) => {
        if (typeof value === 'string') {
          result[key] = value;
        }
      });
    }
    return result;
  }

  async healthCheck(serviceName: string): Promise<boolean> {
    const client = this.clients.get(serviceName);
    if (!client) {
      return false;
    }

    try {
      const response = await client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  async allHealthChecks(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [name] of this.clients) {
      results[name] = await this.healthCheck(name);
    }
    
    return results;
  }
}

export const httpClient = new HttpClient();
export default httpClient;
