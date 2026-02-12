import ky, { type KyInstance, type Options, type BeforeRequestHook, type AfterResponseHook } from 'ky';

// API Client Options Interface
export interface ApiClientOptions {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

// Request Config Interface
export interface RequestConfig extends Omit<Options, 'headers'> {
  headers?: Record<string, string>;
}

// Response Type
export interface Response<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

// API Client Class
export class ApiClient {
  private client: KyInstance;
  private options: ApiClientOptions;
  private requestInterceptors: BeforeRequestHook[] = [];
  private responseInterceptors: { success: AfterResponseHook; error: AfterResponseHook }[] = [];

  constructor(options: ApiClientOptions) {
    this.options = {
      timeout: 30000,
      retries: 3,
      ...options,
    };

    this.client = ky.create({
      prefixUrl: this.options.baseURL,
      timeout: this.options.timeout,
      retry: {
        limit: this.options.retries,
      },
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.options.apiKey,
        ...this.options.headers,
      },
    });
  }

  // Add request interceptor
  addRequestInterceptor(interceptor: BeforeRequestHook): void {
    this.requestInterceptors.push(interceptor);
    this.updateClient();
  }

  // Add response interceptor
  addResponseInterceptor(success: AfterResponseHook, error: AfterResponseHook): void {
    this.responseInterceptors.push({ success, error });
    this.updateClient();
  }

  // Update client with interceptors
  private updateClient(): void {
    const hooks: { beforeRequest: BeforeRequestHook[]; afterResponse: AfterResponseHook[] } = {
      beforeRequest: [
        async (request) => {
          for (const interceptor of this.requestInterceptors) {
            await interceptor(request);
          }
        },
      ],
      afterResponse: [
        async (request, options, response) => {
          for (const { success } of this.responseInterceptors) {
            await success(request, options, response);
          }
          return response;
        },
        async (request, options, error) => {
          for (const { error: errorHandler } of this.responseInterceptors) {
            await errorHandler(request, options, error);
          }
          throw error;
        },
      ],
    };

    this.client = ky.create({
      ...this.client.options,
      ...hooks,
    });
  }

  // GET request
  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get(path, { searchParams: params });
    return response.json<T>();
  }

  // POST request
  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.client.post(path, { json: body });
    return response.json<T>();
  }

  // PUT request
  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.client.put(path, { json: body });
    return response.json<T>();
  }

  // PATCH request
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await this.client.patch(path, { json: body });
    return response.json<T>();
  }

  // DELETE request
  async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete(path);
    return response.json<T>();
  }

  // Upload file
  async upload<T>(path: string, file: File, fieldName: string = 'file'): Promise<T> {
    const formData = new FormData();
    formData.append(fieldName, file);
    const response = await this.client.post(path, { body: formData });
    return response.json<T>();
  }

  // Download file
  async download(path: string, filename: string): Promise<void> {
    const response = await this.client.get(path);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Set auth token
  setAuthToken(token: string): void {
    this.client = ky.create({
      ...this.client.options,
      headers: {
        ...this.client.options.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Clear auth token
  clearAuthToken(): void {
    const headers = { ...this.client.options.headers };
    delete headers.Authorization;
    this.client = ky.create({
      ...this.client.options,
      headers,
    });
  }
}

// Default export
export default ApiClient;
