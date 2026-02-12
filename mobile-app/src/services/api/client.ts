import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import apiConfig from '../../config/api.config';
import { store } from '../../store';
import { logout, setTokens } from '../../features/auth/store/auth.slice';

// Helper to get access token from store
const getAccessToken = (): string | null => {
  const state = store.getState();
  return state.auth.accessToken;
};

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: apiConfig.API_BASE_URL,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const state = store.getState();
        const token = state.auth.token;
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add request timestamp for debugging
        config.headers['X-Request-Time'] = new Date().toISOString();
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401) {
          // Token expired or invalid - logout user
          store.dispatch(logout());
        }
        
        if (error.response?.status === 403) {
          // Forbidden - check if user needs to verify email/phone
          console.warn('Access forbidden - may need additional verification');
        }
        
        if (originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Handle 503 - service unavailable with retry
          if (error.response?.status === 503) {
            await this.delay(apiConfig.retry.delay);
            return this.client.request(originalRequest);
          }
        }
        
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      return {
        message: (error.response.data as any)?.message || 'Request failed',
        status: error.response.status,
        data: error.response.data,
      };
    }
    
    if (error.request) {
      return {
        message: 'No response from server',
        status: 0,
        data: null,
      };
    }
    
    return {
      message: error.message,
      status: 0,
      data: null,
    };
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  public setAuthToken(token: string): void {
    store.dispatch(setTokens({ accessToken: token, refreshToken: '' }));
  }

  public clearAuthToken(): void {
    store.dispatch(logout());
  }
}

export interface ApiError {
  message: string;
  status: number;
  data: unknown;
}

export const apiClient = ApiClient.getInstance();
