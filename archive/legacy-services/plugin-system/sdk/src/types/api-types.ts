/**
 * API Types
 * 
 * Type definitions for the MNBara API system
 */

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * API endpoint types
 */
export type ApiEndpointType = 'rest' | 'graphql' | 'websocket' | 'webhook' | 'grpc' | 'custom';

/**
 * API authentication types
 */
export type ApiAuthType = 'none' | 'api-key' | 'bearer' | 'basic' | 'oauth2' | 'jwt' | 'custom';

/**
 * API response formats
 */
export type ApiResponseFormat = 'json' | 'xml' | 'text' | 'binary' | 'protobuf' | 'graphql' | 'custom';

/**
 * API request/response data
 */
export interface ApiData {
  headers?: Record<string, string>;
  query?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
  files?: File[];
  cookies?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * API endpoint definition
 */
export interface ApiEndpoint {
  id: string;
  path: string;
  method: HttpMethod;
  type: ApiEndpointType;
  description?: string;
  tags?: string[];
  auth?: ApiAuthType;
  request?: {
    schema?: any;
    examples?: ApiData[];
    required?: string[];
    headers?: Record<string, string>;
  };
  response?: {
    schema?: any;
    examples?: ApiData[];
    headers?: Record<string, string>;
    statusCodes?: number[];
  };
  rateLimit?: RateLimitConfig;
  timeout?: number;
  retries?: number;
  cache?: CacheConfig;
  validation?: ValidationConfig;
  middleware?: string[];
  hooks?: string[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  headers?: boolean;
  draft_polli_ratelimit_headers?: boolean;
  skip?: (req: any) => boolean;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (req: any, res: any, options: RateLimitConfig) => void;
  store?: any;
}

/**
 * Caching configuration
 */
export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  keyGenerator?: (req: any) => string;
  skip?: (req: any) => boolean;
  headers?: {
    'Cache-Control'?: string;
    'ETag'?: boolean;
    'Last-Modified'?: boolean;
  };
  store?: 'memory' | 'redis' | 'file' | 'custom';
  storeOptions?: any;
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  enabled: boolean;
  schema?: any;
  options?: {
    abortEarly?: boolean;
    allowUnknown?: boolean;
    stripUnknown?: boolean;
    skipFunctions?: boolean;
    presence?: 'optional' | 'required';
    noDefaults?: boolean;
  };
  customValidators?: Record<string, (value: any, options: any) => boolean>;
}

/**
 * API request context
 */
export interface ApiRequestContext {
  id: string;
  timestamp: Date;
  method: HttpMethod;
  path: string;
  endpoint: ApiEndpoint;
  data: ApiData;
  auth?: {
    type: ApiAuthType;
    credentials?: any;
    user?: any;
    permissions?: string[];
  };
  metadata?: Record<string, any>;
  
  // Request lifecycle
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Error handling
  error?: ApiError;
  
  // Rate limiting
  rateLimit?: {
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter?: number;
  };
  
  // Caching
  cache?: {
    hit: boolean;
    key?: string;
    ttl?: number;
  };
}

/**
 * API response context
 */
export interface ApiResponseContext {
  id: string;
  requestId: string;
  timestamp: Date;
  statusCode: number;
  data: ApiData;
  format: ApiResponseFormat;
  metadata?: Record<string, any>;
  
  // Response lifecycle
  startTime: number;
  endTime?: number;
  duration?: number;
  
  // Error handling
  error?: ApiError;
  
  // Caching
  cache?: {
    key?: string;
    ttl?: number;
    headers?: Record<string, string>;
  };
}

/**
 * API error information
 */
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  timestamp: Date;
  requestId: string;
  endpointId: string;
  pluginId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: ApiRequestContext;
  originalError?: Error;
  stack?: string;
  details?: Record<string, any>;
  retryable: boolean;
  retryAfter?: number;
}

/**
 * API middleware function
 */
export type ApiMiddleware = (req: any, res: any, next: () => void) => void | Promise<void>;

/**
 * API plugin configuration
 */
export interface ApiPluginConfig {
  enabled: boolean;
  baseUrl?: string;
  port?: number;
  host?: string;
  cors?: {
    enabled: boolean;
    origin?: string | string[] | ((origin: string) => boolean);
    methods?: HttpMethod[];
    allowedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
  security?: {
    helmet?: boolean;
    rateLimit?: boolean;
    cors?: boolean;
    compression?: boolean;
    bodyParser?: boolean;
    cookieParser?: boolean;
    session?: boolean;
    csrf?: boolean;
  };
  logging?: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text' | 'combined';
    excludePaths?: string[];
  };
  metrics?: {
    enabled: boolean;
    endpoint?: string;
    includeQueryParams?: boolean;
    excludePaths?: string[];
  };
  health?: {
    enabled: boolean;
    endpoint?: string;
    checks?: string[];
  };
  documentation?: {
    enabled: boolean;
    endpoint?: string;
    title?: string;
    version?: string;
    description?: string;
  };
}

/**
 * API context for plugin development
 */
export interface ApiContext {
  // Request/Response handling
  request: ApiRequestContext;
  response: ApiResponseContext;
  
  // Configuration
  config: ApiPluginConfig;
  
  // Methods
  createEndpoint: (config: Partial<ApiEndpoint>) => Promise<ApiEndpoint>;
  updateEndpoint: (id: string, config: Partial<ApiEndpoint>) => Promise<ApiEndpoint>;
  deleteEndpoint: (id: string) => Promise<void>;
  getEndpoint: (id: string) => Promise<ApiEndpoint | null>;
  getEndpoints: (filter?: Partial<ApiEndpoint>) => Promise<ApiEndpoint[]>;
  
  // Request utilities
  validateRequest: (schema: any, data: any) => Promise<boolean>;
  parseRequest: (req: any) => Promise<ApiData>;
  formatResponse: (data: any, format: ApiResponseFormat) => Promise<ApiData>;
  
  // Response utilities
  sendResponse: (statusCode: number, data: any, headers?: Record<string, string>) => Promise<void>;
  sendError: (error: ApiError) => Promise<void>;
  sendJson: (data: any, statusCode?: number) => Promise<void>;
  sendText: (text: string, statusCode?: number) => Promise<void>;
  sendFile: (path: string, options?: any) => Promise<void>;
  redirect: (url: string, statusCode?: number) => Promise<void>;
  
  // Middleware
  use: (middleware: ApiMiddleware) => void;
  useBefore: (middleware: ApiMiddleware, endpointId?: string) => void;
  useAfter: (middleware: ApiMiddleware, endpointId?: string) => void;
  
  // Authentication
  authenticate: (type: ApiAuthType, credentials: any) => Promise<any>;
  authorize: (permissions: string[]) => Promise<boolean>;
  getUser: () => Promise<any>;
  getPermissions: () => Promise<string[]>;
  
  // Rate limiting
  checkRateLimit: (key?: string) => Promise<boolean>;
  getRateLimitInfo: (key?: string) => Promise<RateLimitConfig & { remaining: number; reset: Date }>;
  
  // Caching
  getCache: (key: string) => Promise<any>;
  setCache: (key: string, value: any, ttl?: number) => Promise<void>;
  deleteCache: (key: string) => Promise<void>;
  clearCache: () => Promise<void>;
  
  // Logging
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any) => void;
  
  // Error handling
  createError: (code: string, message: string, statusCode?: number, details?: any) => ApiError;
  throwError: (error: ApiError) => never;
  
  // Utilities
  delay: (ms: number) => Promise<void>;
  timeout: <T>(promise: Promise<T>, ms: number) => Promise<T>;
  retry: <T>(fn: () => Promise<T>, options?: { count?: number; delay?: number }) => Promise<T>;
  
  // Validation
  validate: (data: any, schema: any) => boolean;
  
  // Security
  checkPermission: (permission: string) => boolean;
  
  // Timing
  startTimer: (name: string) => void;
  endTimer: (name: string) => number;
  getElapsedTime: (name: string) => number;
}

/**
 * Default API plugin configuration
 */
export const DEFAULT_API_PLUGIN_CONFIG: ApiPluginConfig = {
  enabled: true,
  baseUrl: 'http://localhost:3000',
  port: 3000,
  host: 'localhost',
  cors: {
    enabled: true,
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400
  },
  security: {
    helmet: true,
    rateLimit: true,
    cors: true,
    compression: true,
    bodyParser: true,
    cookieParser: true,
    session: false,
    csrf: false
  },
  logging: {
    enabled: true,
    level: 'info',
    format: 'combined',
    excludePaths: ['/health', '/metrics']
  },
  metrics: {
    enabled: true,
    endpoint: '/metrics',
    includeQueryParams: false,
    excludePaths: ['/health']
  },
  health: {
    enabled: true,
    endpoint: '/health',
    checks: ['database', 'redis', 'external-services']
  },
  documentation: {
    enabled: true,
    endpoint: '/docs',
    title: 'MNBara Plugin API',
    version: '1.0.0',
    description: 'API documentation for MNBara plugin'
  }
} as const;

/**
 * Common HTTP status codes
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

/**
 * Common API error codes
 */
export const API_ERROR_CODES = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  CONFLICT: 'CONFLICT',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EXPIRED_CREDENTIALS: 'EXPIRED_CREDENTIALS',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;