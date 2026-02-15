/**
 * API Endpoints
 * 
 * API endpoint utilities for MNBara plugins
 */

import { PluginContext } from '../types/plugin-types';

export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS'
}

export enum ContentType {
  JSON = 'application/json',
  FORM_URLENCODED = 'application/x-www-form-urlencoded',
  MULTIPART_FORM_DATA = 'multipart/form-data',
  TEXT = 'text/plain',
  HTML = 'text/html',
  XML = 'application/xml',
  OCTET_STREAM = 'application/octet-stream'
}

export enum APIStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  PENDING = 'pending',
  TIMEOUT = 'timeout',
  RATE_LIMITED = 'rate_limited',
  UNAUTHORIZED = 'unauthorized',
  FORBIDDEN = 'forbidden',
  NOT_FOUND = 'not_found',
  VALIDATION_ERROR = 'validation_error',
  SERVER_ERROR = 'server_error'
}

export interface APIRequest {
  url: string;
  method: HTTPMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  contentType?: ContentType;
  auth?: APIAuth;
  validateStatus?: (status: number) => boolean;
  transformRequest?: (data: any) => any;
  transformResponse?: (data: any) => any;
}

export interface APIResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: APIRequest;
  request?: any;
  duration: number;
  size: number;
}

export interface APIError {
  message: string;
  status?: number;
  statusText?: string;
  data?: any;
  config?: APIRequest;
  request?: any;
  code?: string;
  stack?: string;
}

export interface APIAuth {
  type: 'basic' | 'bearer' | 'api-key' | 'custom';
  credentials: Record<string, string>;
}

export interface APIEndpoint {
  name: string;
  path: string;
  method: HTTPMethod;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: APIRequestBody;
  responses?: APIResponseDefinition[];
  authentication?: boolean;
  rateLimit?: APIRateLimit;
  tags?: string[];
  deprecated?: boolean;
}

export interface APIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  description?: string;
  default?: any;
  enum?: any[];
  format?: string;
  minimum?: number;
  maximum?: number;
  pattern?: string;
}

export interface APIRequestBody {
  description?: string;
  required?: boolean;
  contentType?: ContentType;
  schema?: any;
  example?: any;
}

export interface APIResponseDefinition {
  status: number;
  description?: string;
  contentType?: ContentType;
  schema?: any;
  example?: any;
}

export interface APIRateLimit {
  limit: number;
  window: number; // milliseconds
  remaining?: number;
  reset?: number;
}

export interface APICache {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  clear: () => Promise<void>;
}

export interface APIManager {
  // Request execution
  request: (config: APIRequest) => Promise<APIResponse>;
  get: (url: string, config?: Partial<APIRequest>) => Promise<APIResponse>;
  post: (url: string, data?: any, config?: Partial<APIRequest>) => Promise<APIResponse>;
  put: (url: string, data?: any, config?: Partial<APIRequest>) => Promise<APIResponse>;
  delete: (url: string, config?: Partial<APIRequest>) => Promise<APIResponse>;
  patch: (url: string, data?: any, config?: Partial<APIRequest>) => Promise<APIResponse>;
  
  // Endpoint management
  registerEndpoint: (endpoint: APIEndpoint) => void;
  unregisterEndpoint: (name: string) => boolean;
  getEndpoint: (name: string) => APIEndpoint | undefined;
  getEndpoints: () => APIEndpoint[];
  executeEndpoint: (name: string, parameters?: Record<string, any>, body?: any) => Promise<APIResponse>;
  
  // Configuration
  setBaseURL: (baseURL: string) => void;
  getBaseURL: () => string;
  setDefaultHeaders: (headers: Record<string, string>) => void;
  getDefaultHeaders: () => Record<string, string>;
  setTimeout: (timeout: number) => void;
  getTimeout: () => number;
  setAuth: (auth: APIAuth) => void;
  getAuth: () => APIAuth | undefined;
  
  // Caching
  setCache: (cache: APICache) => void;
  getCache: () => APICache | undefined;
  enableCaching: (enabled: boolean) => void;
  isCachingEnabled: () => boolean;
  
  // Rate limiting
  setRateLimit: (endpoint: string, limit: number, window: number) => void;
  getRateLimit: (endpoint: string) => APIRateLimit | undefined;
  checkRateLimit: (endpoint: string) => boolean;
  resetRateLimit: (endpoint: string) => void;
  
  // Interceptors
  addRequestInterceptor: (interceptor: APIRequestInterceptor) => void;
  addResponseInterceptor: (interceptor: APIResponseInterceptor) => void;
  removeRequestInterceptor: (interceptor: APIRequestInterceptor) => boolean;
  removeResponseInterceptor: (interceptor: APIResponseInterceptor) => boolean;
  
  // Utilities
  buildURL: (path: string, params?: Record<string, string>) => string;
  parseResponse: (response: APIResponse) => any;
  handleError: (error: APIError) => void;
  
  // Statistics
  getStats: () => APIStats;
  resetStats: () => void;
}

export interface APIRequestInterceptor {
  (config: APIRequest): APIRequest | Promise<APIRequest>;
}

export interface APIResponseInterceptor {
  (config: APIResponse): APIResponse | Promise<APIResponse>;
}

export interface APIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalDataTransferred: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimitHits: number;
  requestTypes: Record<HTTPMethod, number>;
  statusCodes: Record<number, number>;
}

export class DefaultAPIManager implements APIManager {
  private baseURL: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': ContentType.JSON
  };
  private timeout: number = 30000;
  private auth?: APIAuth;
  private cache?: APICache;
  private cachingEnabled: boolean = true;
  private endpoints: Map<string, APIEndpoint> = new Map();
  private rateLimits: Map<string, APIRateLimit> = new Map();
  private requestInterceptors: APIRequestInterceptor[] = [];
  private responseInterceptors: APIResponseInterceptor[] = [];
  private stats: APIStats;

  constructor(
    private pluginContext: PluginContext,
    options?: {
      baseURL?: string;
      headers?: Record<string, string>;
      timeout?: number;
      cache?: APICache;
      enableCaching?: boolean;
    }
  ) {
    this.baseURL = options?.baseURL || '';
    if (options?.headers) {
      this.defaultHeaders = { ...this.defaultHeaders, ...options.headers };
    }
    this.timeout = options?.timeout || 30000;
    this.cache = options?.cache;
    this.cachingEnabled = options?.enableCaching !== false;
    
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalDataTransferred: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitHits: 0,
      requestTypes: {} as Record<HTTPMethod, number>,
      statusCodes: {}
    };
  }

  async request(config: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    let requestConfig = { ...config };
    
    try {
      // Apply request interceptors
      for (const interceptor of this.requestInterceptors) {
        requestConfig = await interceptor(requestConfig);
      }
      
      // Build URL
      const url = this.buildURL(requestConfig.url, requestConfig.params);
      
      // Check rate limit
      if (!this.checkRateLimit(url)) {
        this.stats.rateLimitHits++;
        throw new Error('Rate limit exceeded');
      }
      
      // Check cache
      if (this.cachingEnabled && this.cache && requestConfig.method === HTTPMethod.GET) {
        const cachedResponse = await this.cache.get(url);
        if (cachedResponse) {
          this.stats.cacheHits++;
          return cachedResponse;
        }
        this.stats.cacheMisses++;
      }
      
      // Prepare headers
      const headers = { ...this.defaultHeaders, ...requestConfig.headers };
      if (this.auth) {
        this.addAuthHeaders(headers, this.auth);
      }
      
      // Prepare body
      let body = requestConfig.body;
      if (body && typeof body === 'object' && headers['Content-Type'] === ContentType.JSON) {
        body = JSON.stringify(body);
      }
      
      // Execute request
      const response = await this.executeRequest(url, {
        ...requestConfig,
        headers,
        body
      });
      
      // Apply response interceptors
      let finalResponse = response;
      for (const interceptor of this.responseInterceptors) {
        finalResponse = await interceptor(finalResponse);
      }
      
      // Cache successful GET responses
      if (this.cachingEnabled && this.cache && requestConfig.method === HTTPMethod.GET && response.status >= 200 && response.status < 300) {
        await this.cache.set(url, finalResponse, 300000); // Cache for 5 minutes
      }
      
      // Update stats
      this.updateStats(requestConfig.method, response.status, Date.now() - startTime, response.size);
      
      return finalResponse;
      
    } catch (error) {
      this.updateStats(requestConfig.method, 0, Date.now() - startTime, 0, true);
      throw error;
    }
  }

  async get(url: string, config?: Partial<APIRequest>): Promise<APIResponse> {
    return this.request({
      url,
      method: HTTPMethod.GET,
      ...config
    });
  }

  async post(url: string, data?: any, config?: Partial<APIRequest>): Promise<APIResponse> {
    return this.request({
      url,
      method: HTTPMethod.POST,
      body: data,
      ...config
    });
  }

  async put(url: string, data?: any, config?: Partial<APIRequest>): Promise<APIResponse> {
    return this.request({
      url,
      method: HTTPMethod.PUT,
      body: data,
      ...config
    });
  }

  async delete(url: string, config?: Partial<APIRequest>): Promise<APIResponse> {
    return this.request({
      url,
      method: HTTPMethod.DELETE,
      ...config
    });
  }

  async patch(url: string, data?: any, config?: Partial<APIRequest>): Promise<APIResponse> {
    return this.request({
      url,
      method: HTTPMethod.PATCH,
      body: data,
      ...config
    });
  }

  registerEndpoint(endpoint: APIEndpoint): void {
    this.endpoints.set(endpoint.name, endpoint);
  }

  unregisterEndpoint(name: string): boolean {
    return this.endpoints.delete(name);
  }

  getEndpoint(name: string): APIEndpoint | undefined {
    return this.endpoints.get(name);
  }

  getEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  async executeEndpoint(name: string, parameters?: Record<string, any>, body?: any): Promise<APIResponse> {
    const endpoint = this.endpoints.get(name);
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${name}`);
    }
    
    let url = endpoint.path;
    
    // Replace path parameters
    if (parameters && endpoint.parameters) {
      for (const param of endpoint.parameters) {
        if (param.in === 'path' && parameters[param.name]) {
          url = url.replace(`{${param.name}}`, parameters[param.name]);
        }
      }
    }
    
    // Build query parameters
    const queryParams: Record<string, string> = {};
    if (parameters && endpoint.parameters) {
      for (const param of endpoint.parameters) {
        if (param.in === 'query' && parameters[param.name] !== undefined) {
          queryParams[param.name] = String(parameters[param.name]);
        }
      }
    }
    
    return this.request({
      url,
      method: endpoint.method,
      body,
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined
    });
  }

  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
  }

  getBaseURL(): string {
    return this.baseURL;
  }

  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  getDefaultHeaders(): Record<string, string> {
    return { ...this.defaultHeaders };
  }

  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  getTimeout(): number {
    return this.timeout;
  }

  setAuth(auth: APIAuth): void {
    this.auth = auth;
  }

  getAuth(): APIAuth | undefined {
    return this.auth;
  }

  setCache(cache: APICache): void {
    this.cache = cache;
  }

  getCache(): APICache | undefined {
    return this.cache;
  }

  enableCaching(enabled: boolean): void {
    this.cachingEnabled = enabled;
  }

  isCachingEnabled(): boolean {
    return this.cachingEnabled;
  }

  setRateLimit(endpoint: string, limit: number, window: number): void {
    this.rateLimits.set(endpoint, { limit, window, remaining: limit });
  }

  getRateLimit(endpoint: string): APIRateLimit | undefined {
    return this.rateLimits.get(endpoint);
  }

  checkRateLimit(endpoint: string): boolean {
    const rateLimit = this.rateLimits.get(endpoint);
    if (!rateLimit) {
      return true;
    }
    
    const now = Date.now();
    if (rateLimit.reset && rateLimit.reset < now) {
      // Reset the rate limit
      rateLimit.remaining = rateLimit.limit;
      rateLimit.reset = now + rateLimit.window;
    }
    
    if (rateLimit.remaining === undefined) {
      rateLimit.remaining = rateLimit.limit;
      rateLimit.reset = now + rateLimit.window;
    }
    
    if (rateLimit.remaining <= 0) {
      return false;
    }
    
    rateLimit.remaining--;
    return true;
  }

  resetRateLimit(endpoint: string): void {
    const rateLimit = this.rateLimits.get(endpoint);
    if (rateLimit) {
      rateLimit.remaining = rateLimit.limit;
      rateLimit.reset = Date.now() + rateLimit.window;
    }
  }

  addRequestInterceptor(interceptor: APIRequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  addResponseInterceptor(interceptor: APIResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  removeRequestInterceptor(interceptor: APIRequestInterceptor): boolean {
    const index = this.requestInterceptors.indexOf(interceptor);
    if (index !== -1) {
      this.requestInterceptors.splice(index, 1);
      return true;
    }
    return false;
  }

  removeResponseInterceptor(interceptor: APIResponseInterceptor): boolean {
    const index = this.responseInterceptors.indexOf(interceptor);
    if (index !== -1) {
      this.responseInterceptors.splice(index, 1);
      return true;
    }
    return false;
  }

  buildURL(path: string, params?: Record<string, string>): string {
    let url = path;
    
    if (this.baseURL && !url.startsWith('http')) {
      url = `${this.baseURL}/${url.replace(/^\//, '')}`;
    }
    
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      url += `?${queryString}`;
    }
    
    return url;
  }

  parseResponse(response: APIResponse): any {
    return response.data;
  }

  handleError(error: APIError): void {
    console.error('API Error:', error.message, error);
  }

  getStats(): APIStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalDataTransferred: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitHits: 0,
      requestTypes: {} as Record<HTTPMethod, number>,
      statusCodes: {}
    };
  }

  private async executeRequest(url: string, config: APIRequest): Promise<APIResponse> {
    // Simulate HTTP request - in a real implementation, this would use fetch or axios
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
    
    const status = this.getRandomStatus();
    const data = this.generateMockResponse(config.method, url);
    const responseSize = JSON.stringify(data).length;
    
    if (status >= 400) {
      throw new Error(`HTTP ${status}: ${this.getStatusText(status)}`);
    }
    
    return {
      data,
      status,
      statusText: this.getStatusText(status),
      headers: {
        'content-type': ContentType.JSON,
        'content-length': String(responseSize)
      },
      config,
      duration: Math.floor(Math.random() * 1000),
      size: responseSize
    };
  }

  private addAuthHeaders(headers: Record<string, string>, auth: APIAuth): void {
    switch (auth.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${auth.credentials.token}`;
        break;
      case 'basic':
        const basicAuth = btoa(`${auth.credentials.username}:${auth.credentials.password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        break;
      case 'api-key':
        headers[auth.credentials.header || 'X-API-Key'] = auth.credentials.key;
        break;
      case 'custom':
        Object.assign(headers, auth.credentials);
        break;
    }
  }

  private updateStats(method: HTTPMethod, status: number, duration: number, size: number, failed: boolean = false): void {
    this.stats.totalRequests++;
    
    if (failed) {
      this.stats.failedRequests++;
    } else if (status >= 200 && status < 300) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }
    
    this.stats.averageResponseTime = (this.stats.averageResponseTime + duration) / 2;
    this.stats.totalDataTransferred += size;
    
    // Update request types
    this.stats.requestTypes[method] = (this.stats.requestTypes[method] || 0) + 1;
    
    // Update status codes
    this.stats.statusCodes[status] = (this.stats.statusCodes[status] || 0) + 1;
  }

  private getRandomStatus(): number {
    const statuses = [200, 201, 204, 400, 401, 403, 404, 429, 500, 502, 503];
    const weights = [60, 15, 5, 3, 2, 1, 4, 1, 2, 1, 1];
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;
    
    let cumulativeWeight = 0;
    for (let i = 0; i < statuses.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return statuses[i];
      }
    }
    
    return 200;
  }

  private getStatusText(status: number): string {
    const statusTexts: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    
    return statusTexts[status] || 'Unknown';
  }

  private generateMockResponse(method: HTTPMethod, url: string): any {
    const path = url.split('?')[0];
    const segments = path.split('/').filter(segment => segment);
    
    if (method === HTTPMethod.GET) {
      if (segments.includes('users')) {
        return {
          users: [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
          ],
          total: 2,
          page: 1,
          limit: 10
        };
      } else if (segments.includes('posts')) {
        return {
          posts: [
            { id: 1, title: 'First Post', content: 'This is the first post' },
            { id: 2, title: 'Second Post', content: 'This is the second post' }
          ],
          total: 2,
          page: 1,
          limit: 10
        };
      } else {
        return { message: 'Success', timestamp: Date.now() };
      }
    } else if (method === HTTPMethod.POST) {
      return { id: Math.floor(Math.random() * 1000), created: true, timestamp: Date.now() };
    } else if (method === HTTPMethod.PUT) {
      return { updated: true, timestamp: Date.now() };
    } else if (method === HTTPMethod.DELETE) {
      return { deleted: true, timestamp: Date.now() };
    } else {
      return { message: 'Success', timestamp: Date.now() };
    }
  }
}