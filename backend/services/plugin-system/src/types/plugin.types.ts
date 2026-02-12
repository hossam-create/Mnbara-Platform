// ============================================================
// Plugin System - Type Definitions
// ============================================================

/**
 * Plugin Manifest (plugin.json)
 */
export interface PluginManifest {
  name: string; // e.g., "@mnbara/stripe-payment"
  version: string; // Semantic versioning
  description?: string;
  author?: string;
  license?: string;
  
  mnbara: {
    minVersion: string; // Minimum platform version required
    maxVersion?: string; // Maximum platform version supported
  };
  
  type: PluginType;
  category: PluginCategory;
  
  hooks?: string[]; // List of hooks this plugin registers
  permissions?: string[]; // Required permissions
  config?: Record<string, ConfigFieldDefinition>;
  dependencies?: Record<string, string>; // npm dependencies
  
  entry: string; // Entry point file (e.g., "dist/index.js")
}

export enum PluginType {
  PAYMENT_GATEWAY = 'PAYMENT_GATEWAY',
  SHIPPING_PROVIDER = 'SHIPPING_PROVIDER',
  ANALYTICS = 'ANALYTICS',
  MARKETING = 'MARKETING',
  CONTENT = 'CONTENT',
  SECURITY = 'SECURITY',
  INTEGRATION = 'INTEGRATION',
  CUSTOM = 'CUSTOM'
}

export enum PluginCategory {
  PAYMENT = 'PAYMENT',
  SHIPPING = 'SHIPPING',
  MARKETING = 'MARKETING',
  ANALYTICS = 'ANALYTICS',
  CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
  CONTENT = 'CONTENT',
  SOCIAL = 'SOCIAL',
  MARKETPLACE = 'MARKETPLACE',
  UTILITY = 'UTILITY',
  SECURITY = 'SECURITY'
}

export interface ConfigFieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  secret?: boolean; // Should be encrypted
  default?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * Plugin Context - Available to plugins
 */
export interface PluginContext {
  pluginId: string;
  pluginName: string;
  pluginVersion: string;
  config: Record<string, any>;
  logger: Logger;
  hooks: HookRegistry;
  events: EventBus;
  services: ServiceAccess;
  database: DatabaseAccess;
}

/**
 * Hook Definition
 */
export interface HookDefinition {
  name: string; // e.g., "payment.process"
  handler: Function;
  priority: number; // Lower = higher priority
  pluginId: string;
}

/**
 * Event Definition
 */
export interface EventDefinition {
  name: string;
  data: any;
  timestamp: Date;
  pluginId?: string;
  userId?: string;
}

/**
 * Logger Interface
 */
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, error?: Error, meta?: any): void;
}

/**
 * Hook Registry Interface
 */
export interface HookRegistry {
  register(hookName: string, handler: Function, priority?: number): void;
  unregister(hookName: string, handler: Function): void;
  execute(hookName: string, data: any): Promise<any>;
  has(hookName: string): boolean;
}

/**
 * Event Bus Interface
 */
export interface EventBus {
  emit(eventName: string, data: any): void;
  on(eventName: string, handler: Function): void;
  off(eventName: string, handler: Function): void;
}

/**
 * Service Access Interface
 */
export interface ServiceAccess {
  get<T>(serviceName: string): T;
  has(serviceName: string): boolean;
  list(): string[];
}

/**
 * Database Access Interface (with permissions)
 */
export interface DatabaseAccess {
  query(sql: string, params?: any[]): Promise<any>;
  transaction<T>(callback: (tx: any) => Promise<T>): Promise<T>;
}

/**
 * Plugin Loader Result
 */
export interface PluginLoadResult {
  success: boolean;
  pluginId?: string;
  error?: string;
  warnings?: string[];
}

/**
 * Plugin Installation Result
 */
export interface PluginInstallResult {
  success: boolean;
  pluginId?: string;
  error?: string;
}

