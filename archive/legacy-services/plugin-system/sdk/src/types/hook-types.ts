/**
 * Hook System Types
 * 
 * Type definitions for the MNBara hook system
 */

/**
 * Hook priority levels
 */
export type HookPriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Hook event types
 */
export type HookEvent = 
  | 'plugin:install'
  | 'plugin:enable'
  | 'plugin:disable'
  | 'plugin:uninstall'
  | 'plugin:update'
  | 'plugin:error'
  | 'wallet:connect'
  | 'wallet:disconnect'
  | 'wallet:switch-chain'
  | 'wallet:account-change'
  | 'transaction:submit'
  | 'transaction:confirm'
  | 'transaction:fail'
  | 'transaction:speed-up'
  | 'transaction:cancel'
  | 'ui:mount'
  | 'ui:unmount'
  | 'ui:update'
  | 'ui:error'
  | 'api:request'
  | 'api:response'
  | 'api:error'
  | 'api:rate-limit'
  | 'storage:read'
  | 'storage:write'
  | 'storage:delete'
  | 'system:startup'
  | 'system:shutdown'
  | 'system:error'
  | 'custom:*';

/**
 * Hook execution context
 */
export interface HookExecutionContext {
  event: HookEvent;
  priority: HookPriority;
  timestamp: Date;
  pluginId: string;
  pluginName: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  source?: string;
  target?: string;
  correlationId?: string;
  parentId?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Hook handler function
 */
export type HookHandler = (context: HookExecutionContext) => Promise<void> | void;

/**
 * Hook registration information
 */
export interface HookRegistration {
  id: string;
  event: HookEvent;
  handler: HookHandler;
  priority: HookPriority;
  pluginId: string;
  pluginName: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  conditions?: HookCondition[];
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Hook unregistration information
 */
export interface HookUnregistration {
  id: string;
  pluginId: string;
  event?: HookEvent;
  handler?: HookHandler;
  reason?: string;
  timestamp: Date;
}

/**
 * Hook condition for conditional execution
 */
export interface HookCondition {
  type: 'data' | 'metadata' | 'plugin' | 'user' | 'time' | 'custom';
  field: string;
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than' | 'exists' | 'not-exists' | 'in' | 'not-in';
  value?: any;
  values?: any[];
  caseSensitive?: boolean;
  negate?: boolean;
}

/**
 * Hook error information
 */
export interface HookError {
  code: string;
  message: string;
  timestamp: Date;
  pluginId: string;
  event: HookEvent;
  handlerId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: HookExecutionContext;
  originalError?: Error;
  stack?: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

/**
 * Hook statistics
 */
export interface HookStatistics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  p95ExecutionTime: number;
  errors: HookError[];
  warnings: string[];
  byEvent: Record<HookEvent, {
    executions: number;
    successes: number;
    failures: number;
    averageTime: number;
  }>;
  byPriority: Record<HookPriority, {
    executions: number;
    successes: number;
    failures: number;
    averageTime: number;
  }>;
  byPlugin: Record<string, {
    executions: number;
    successes: number;
    failures: number;
    averageTime: number;
  }>;
}

/**
 * Hook system configuration
 */
export interface HookSystemConfig {
  enabled: boolean;
  maxConcurrentHooks: number;
  defaultTimeout: number;
  defaultRetryCount: number;
  defaultRetryDelay: number;
  enableMetrics: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableStatistics: boolean;
  statisticsRetention: number;
  enableDeadLetterQueue: boolean;
  deadLetterQueueMaxSize: number;
  enableCircuitBreaker: boolean;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
  enableRateLimiting: boolean;
  rateLimitWindow: number;
  rateLimitMax: number;
}

/**
 * Hook context for plugin development
 */
export interface HookContext {
  event: HookEvent;
  priority: HookPriority;
  timestamp: Date;
  pluginId: string;
  pluginName: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  
  // Methods
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, meta?: any) => void;
  emit: (event: HookEvent, data?: Record<string, any>) => Promise<void>;
  register: (event: HookEvent, handler: HookHandler, options?: Partial<HookRegistration>) => Promise<string>;
  unregister: (registrationId: string) => Promise<void>;
  trigger: (event: HookEvent, data?: Record<string, any>, options?: Partial<HookExecutionContext>) => Promise<void>;
  getRegistrations: (pluginId?: string, event?: HookEvent) => Promise<HookRegistration[]>;
  getStatistics: (pluginId?: string, event?: HookEvent) => Promise<HookStatistics>;
  
  // Utilities
  getData: <T = any>(key: string, defaultValue?: T) => T;
  setData: (key: string, value: any) => void;
  hasData: (key: string) => boolean;
  deleteData: (key: string) => void;
  clearData: () => void;
  
  // Validation
  validate: (data: any, schema: any) => boolean;
  
  // Security
  checkPermission: (permission: string) => boolean;
  
  // Timing
  startTimer: (name: string) => void;
  endTimer: (name: string) => number;
  getElapsedTime: (name: string) => number;
  
  // Error handling
  createError: (code: string, message: string, meta?: any) => HookError;
  throwError: (error: HookError) => never;
  
  // Async utilities
  delay: (ms: number) => Promise<void>;
  timeout: <T>(promise: Promise<T>, ms: number) => Promise<T>;
  retry: <T>(fn: () => Promise<T>, options?: { count?: number; delay?: number }) => Promise<T>;
}

/**
 * Default hook system configuration
 */
export const DEFAULT_HOOK_SYSTEM_CONFIG: HookSystemConfig = {
  enabled: true,
  maxConcurrentHooks: 100,
  defaultTimeout: 30000, // 30 seconds
  defaultRetryCount: 3,
  defaultRetryDelay: 1000, // 1 second
  enableMetrics: true,
  enableLogging: true,
  logLevel: 'info',
  enableStatistics: true,
  statisticsRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
  enableDeadLetterQueue: true,
  deadLetterQueueMaxSize: 1000,
  enableCircuitBreaker: true,
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
  enableRateLimiting: true,
  rateLimitWindow: 60000, // 1 minute
  rateLimitMax: 100
} as const;

/**
 * Hook priority values for sorting
 */
export const HOOK_PRIORITY_VALUES: Record<HookPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4
} as const;