/**
 * Plugin SDK Types
 * 
 * Core type definitions for the MNBara Plugin SDK
 */

/**
 * Plugin metadata information
 */
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  keywords?: string[];
  license?: string;
}

/**
 * Plugin manifest - main configuration file for plugins
 */
export interface PluginManifest {
  metadata: PluginMetadata;
  entry: string;
  enabled: boolean;
  installedAt?: Date;
  updatedAt?: Date;
  permissions: PluginPermissions;
  configuration?: PluginConfiguration;
  hooks?: PluginHooks;
  wallet?: {
    supportedChains: string[];
    features: string[];
  };
  ui?: {
    components: string[];
    themes?: string[];
  };
  api?: {
    endpoints: string[];
    rateLimits?: RateLimitConfig;
  };
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Plugin permissions configuration
 */
export interface PluginPermissions {
  wallet: {
    read: boolean;
    write: boolean;
    sign: boolean;
    admin: boolean;
  };
  api: {
    external: boolean;
    internal: boolean;
    admin: boolean;
  };
  ui: {
    render: boolean;
    modify: boolean;
    admin: boolean;
  };
  hooks: {
    register: boolean;
    trigger: boolean;
    admin: boolean;
  };
  storage: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  system: {
    network: boolean;
    filesystem: boolean;
    process: boolean;
    admin: boolean;
  };
}

/**
 * Plugin hooks configuration
 */
export interface PluginHooks {
  onInstall?: string[];
  onEnable?: string[];
  onDisable?: string[];
  onUninstall?: string[];
  onWalletConnect?: string[];
  onWalletDisconnect?: string[];
  onTransaction?: string[];
  onChainChange?: string[];
  custom?: Record<string, string[]>;
}

/**
 * Plugin configuration options
 */
export interface PluginConfiguration {
  settings?: Record<string, any>;
  features?: {
    typescript?: boolean;
    hooks?: boolean;
    walletIntegration?: boolean;
    uiComponents?: boolean;
    apiEndpoints?: boolean;
    storage?: boolean;
    cache?: boolean;
    metrics?: boolean;
  };
  development?: {
    hotReload?: boolean;
    debug?: boolean;
    mockData?: boolean;
  };
  production?: {
    minify?: boolean;
    optimize?: boolean;
    compress?: boolean;
  };
}

/**
 * Plugin state information
 */
export interface PluginState {
  status: 'installed' | 'enabled' | 'disabled' | 'error' | 'uninstalled';
  error?: string;
  metadata: PluginMetadata;
  manifest: PluginManifest;
  installedAt: Date;
  updatedAt: Date;
  lastActivatedAt?: Date;
  lastDeactivatedAt?: Date;
  activationCount: number;
  health: PluginHealth;
  metrics: PluginMetrics;
}

/**
 * Plugin health information
 */
export interface PluginHealth {
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  lastCheck: Date;
  checks: {
    memory: HealthCheck;
    cpu: HealthCheck;
    network: HealthCheck;
    storage: HealthCheck;
    dependencies: HealthCheck;
  };
  errors: PluginError[];
  warnings: string[];
}

/**
 * Individual health check result
 */
export interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  message: string;
  timestamp: Date;
  value?: number;
  threshold?: number;
}

/**
 * Plugin error information
 */
export interface PluginError {
  code: string;
  message: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  stack?: string;
}

/**
 * Plugin metrics information
 */
export interface PluginMetrics {
  activations: number;
  deactivations: number;
  errors: number;
  warnings: number;
  apiCalls: number;
  walletOperations: number;
  uiInteractions: number;
  hookExecutions: number;
  storageOperations: number;
  networkRequests: number;
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
  };
  memoryUsage: {
    current: number;
    peak: number;
    avg: number;
  };
  cpuUsage: {
    current: number;
    peak: number;
    avg: number;
  };
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
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

/**
 * Plugin lifecycle events
 */
export const PLUGIN_LIFECYCLE_EVENTS = {
  INSTALL: 'plugin:install',
  ENABLE: 'plugin:enable',
  DISABLE: 'plugin:disable',
  UNINSTALL: 'plugin:uninstall',
  UPDATE: 'plugin:update',
  ERROR: 'plugin:error',
  HEALTH_CHECK: 'plugin:health-check',
  METRICS_UPDATE: 'plugin:metrics-update'
} as const;

/**
 * Default plugin permissions
 */
export const DEFAULT_PERMISSIONS: PluginPermissions = {
  wallet: {
    read: false,
    write: false,
    sign: false,
    admin: false
  },
  api: {
    external: false,
    internal: true,
    admin: false
  },
  ui: {
    render: true,
    modify: false,
    admin: false
  },
  hooks: {
    register: true,
    trigger: true,
    admin: false
  },
  storage: {
    read: true,
    write: true,
    admin: false
  },
  system: {
    network: false,
    filesystem: false,
    process: false,
    admin: false
  }
} as const;

/**
 * Plugin context containing all SDK utilities and plugin information
 */
export interface PluginContext {
  id: string;
  name: string;
  version: string;
  manifest: PluginManifest;
  permissions: PluginPermissions;
  logger: PluginLogger;
  validator: PluginValidator;
  security: PluginSecurity;
  storage: PluginStorage;
  cache: PluginCache;
  metrics: PluginMetricsCollector;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  log: (level: string, message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  error: (message: string, meta?: any) => void;
}

/**
 * Plugin validator interface
 */
export interface PluginValidator {
  validate: (data: any, schema: any) => any;
  validateField: (value: any, rule: any) => any;
  addRule: (name: string, validator: (...args: any[]) => boolean | string) => void;
  removeRule: (name: string) => void;
  getRules: () => Record<string, (...args: any[]) => boolean | string>;
  validatePluginMetadata: (metadata: PluginMetadata) => ValidationResult;
  validatePluginManifest: (manifest: PluginManifest) => ValidationResult;
  validatePluginPermissions: (permissions: PluginPermissions) => ValidationResult;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Plugin security interface
 */
export interface PluginSecurity {
  checkPermission: (permission: string, permissions: PluginPermissions, context?: any) => boolean;
  validateSecurityPolicy: (policy: any) => boolean;
  initialize: () => Promise<void>;
}

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  deleteMany: (keys: string[]) => Promise<void>;
  has: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
  getMany: (keys: string[]) => Promise<Record<string, any>>;
  setMany: (items: Record<string, any>) => Promise<void>;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
}

/**
 * Plugin cache interface
 */
export interface PluginCache {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any, options?: any) => Promise<void>;
  delete: (key: string) => Promise<boolean>;
  has: (key: string) => Promise<boolean>;
  keys: () => Promise<string[]>;
  clear: () => Promise<void>;
  size: () => Promise<number>;
  getMany: (keys: string[]) => Promise<Record<string, any>>;
  setMany: (items: Record<string, any>, options?: any) => Promise<void>;
  deleteMany: (keys: string[]) => Promise<number>;
  getStats: () => Promise<any>;
  resetStats: () => Promise<void>;
  cleanup: () => Promise<void>;
  initialize: () => Promise<void>;
}

/**
 * Plugin metrics collector interface
 */
export interface PluginMetricsCollector {
  increment: (name: string, value?: number, tags?: Record<string, string>) => void;
  gauge: (name: string, value: number, tags?: Record<string, string>) => void;
  histogram: (name: string, value: number, tags?: Record<string, string>) => void;
  timing: (name: string, duration: number, tags?: Record<string, string>) => void;
  flush: () => Promise<void>;
  cleanup: () => Promise<void>;
}