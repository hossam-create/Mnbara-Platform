import axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  AxiosError,
  InternalAxiosRequestConfig 
} from 'axios';
import {
  createRequestInterceptor,
  createResponseInterceptor,
  createAuthInterceptor,
  createContentTypeInterceptor,
  InterceptorConfig,
} from './interceptors';

// API Client Options Interface
export interface ApiClientOptions {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  interceptorConfig?: InterceptorConfig;
  getToken?: () => string | null;
}

// API Client Class
export class ApiClient {
  private client: AxiosInstance;
  private interceptorConfig: InterceptorConfig;
  private getToken?: () => string | null;

  constructor(options: ApiClientOptions) {
    const { 
      baseURL, 
      timeout = 30000, 
      headers = {}, 
      interceptorConfig = {},
      getToken 
    } = options;

    this.interceptorConfig = interceptorConfig;
    this.getToken = getToken;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    // Setup default interceptors
    this.setupInterceptors();
  }

  // Setup request and response interceptors
  private setupInterceptors(): void {
    // Content Type Interceptor (first)
    const contentTypeInterceptor = createContentTypeInterceptor();
    this.client.interceptors.request.use(
      contentTypeInterceptor.onFulfilled,
      contentTypeInterceptor.onRejected
    );

    // Auth Interceptor (if token getter provided)
    if (this.getToken) {
      const authInterceptor = createAuthInterceptor(this.getToken);
      this.client.interceptors.request.use(
        authInterceptor.onFulfilled,
        authInterceptor.onRejected
      );
    }

    // Request Interceptor (logging and metadata)
    const requestInterceptor = createRequestInterceptor(this.interceptorConfig);
    this.client.interceptors.request.use(
      requestInterceptor.onFulfilled,
      requestInterceptor.onRejected
    );

    // Response Interceptor (error handling and retry)
    const responseInterceptor = createResponseInterceptor(this.interceptorConfig);
    this.client.interceptors.response.use(
      responseInterceptor.onFulfilled,
      responseInterceptor.onRejected
    );
  }

  // GET request
  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(endpoint, config);
    return response.data;
  }

  // POST request
  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(endpoint, data, config);
    return response.data;
  }

  // PUT request
  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(endpoint, data, config);
    return response.data;
  }

  // PATCH request
  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(endpoint, data, config);
    return response.data;
  }

  // DELETE request
  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(endpoint, config);
    return response.data;
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  // Clear authentication token
  clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Add custom request interceptor
  addRequestInterceptor(
    onFulfilled?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>,
    onRejected?: (error: AxiosError) => unknown
  ): number {
    return this.client.interceptors.request.use(onFulfilled, onRejected);
  }

  // Add custom response interceptor
  addResponseInterceptor(
    onFulfilled?: (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: AxiosError) => unknown
  ): number {
    return this.client.interceptors.response.use(onFulfilled, onRejected);
  }

  // Remove request interceptor
  removeRequestInterceptor(interceptorId: number): void {
    this.client.interceptors.request.eject(interceptorId);
  }

  // Remove response interceptor
  removeResponseInterceptor(interceptorId: number): void {
    this.client.interceptors.response.eject(interceptorId);
  }

  // Get the underlying Axios instance
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Default export
export default ApiClient;
