import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';

/**
 * Plugin SDK for third-party developers
 * Provides a comprehensive API for building plugins that integrate with the platform
 */

export interface PluginSDKConfig {
  pluginId: string;
  pluginName: string;
  version: string;
  permissions: string[];
  hooks?: string[];
  sandbox?: boolean;
  debug?: boolean;
}

export interface PluginContext {
  pluginId: string;
  pluginName: string;
  version: string;
  permissions: string[];
  hooks: Map<string, HookRegistration>;
  config: Record<string, any>;
  logger: PluginLogger;
  api: PluginAPI;
  storage: PluginStorage;
  events: PluginEventBus;
}

export interface HookRegistration {
  id: string;
  name: string;
  handler: HookHandler;
  options: HookOptions;
}

export interface HookOptions {
  priority?: number;
  timeout?: number;
  retries?: number;
  fallback?: boolean;
}

export type HookHandler = (data: any, context: PluginContext) => Promise<any>;

export interface PluginLogger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: Error, data?: any) => void;
  debug: (message: string, data?: any) => void;
}

export interface PluginAPI {
  request: (endpoint: string, options?: APIRequestOptions) => Promise<any>;
  get: (endpoint: string, params?: Record<string, any>) => Promise<any>;
  post: (endpoint: string, data?: any, headers?: Record<string, string>) => Promise<any>;
  put: (endpoint: string, data?: any, headers?: Record<string, string>) => Promise<any>;
  delete: (endpoint: string, headers?: Record<string, string>) => Promise<any>;
}

export interface APIRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string> | undefined;
  params?: Record<string, any> | undefined;
  data?: any;
  timeout?: number;
  retries?: number;
}

export interface PluginStorage {
  get: (key: string) => Promise<any>;
  set: (key: string, value: any) => Promise<void>;
  delete: (key: string) => Promise<void>;
  list: (prefix?: string) => Promise<string[]>;
  clear: () => Promise<void>;
}

export interface PluginEventBus {
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  emit: (event: string, data?: any) => void;
  once: (event: string, handler: (...args: any[]) => void) => void;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  permissions: string[];
  hooks?: string[];
  dependencies?: Record<string, string>;
  config?: {
    schema?: Record<string, any>;
    defaults?: Record<string, any>;
  };
  metadata?: {
    category?: string;
    tags?: string[];
    icon?: string;
    screenshots?: string[];
  };
}

/**
 * Main Plugin SDK class that provides the complete API for plugin development
 */
export class PluginSDK extends EventEmitter {
  private config: PluginSDKConfig;
  private context: PluginContext;
  private logger: PluginLogger;
  private api: PluginAPI;
  private storage: PluginStorage;
  private events: PluginEventBus;
  private hooks: Map<string, HookRegistration>;
  private initialized: boolean = false;

  constructor(config: PluginSDKConfig) {
    super();
    this.config = {
      sandbox: true,
      debug: false,
      ...config
    };
    
    this.hooks = new Map();
    this.logger = this.createLogger();
    this.api = this.createAPI();
    this.storage = this.createStorage();
    this.events = this.createEventBus();
    
    this.context = {
      pluginId: config.pluginId,
      pluginName: config.pluginName,
      version: config.version,
      permissions: config.permissions,
      hooks: this.hooks,
      config: {},
      logger: this.logger,
      api: this.api,
      storage: this.storage,
      events: this.events
    };
  }

  /**
   * Initialize the plugin SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Plugin SDK already initialized');
      return;
    }

    try {
      this.logger.info('Initializing Plugin SDK', {
        pluginId: this.config.pluginId,
        version: this.config.version,
        permissions: this.config.permissions
      });

      // Load plugin configuration
      await this.loadConfiguration();
      
      // Validate permissions
      await this.validatePermissions();
      
      // Register default hooks
      await this.registerDefaultHooks();
      
      this.initialized = true;
      this.emit('initialized', this.context);
      this.logger.info('Plugin SDK initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize Plugin SDK', error as Error);
      throw error;
    }
  }

  /**
   * Register a hook handler
   */
  registerHook(hookName: string, handler: HookHandler, options: HookOptions = {}): void {
    if (!this.initialized) {
      throw new Error('Plugin SDK must be initialized before registering hooks');
    }

    const registration: HookRegistration = {
      id: `${this.config.pluginId}:${hookName}`,
      name: hookName,
      handler,
      options: {
        priority: 100,
        timeout: 5000,
        retries: 0,
        fallback: true,
        ...options
      }
    };

    this.hooks.set(hookName, registration);
    this.logger.debug(`Registered hook: ${hookName}`, registration);
    this.emit('hook:registered', { hookName, registration });
  }

  /**
   * Execute a hook
   */
  async executeHook(hookName: string, data: any): Promise<any> {
    if (!this.initialized) {
      throw new Error('Plugin SDK must be initialized before executing hooks');
    }

    const registration = this.hooks.get(hookName);
    if (!registration) {
      throw new Error(`Hook not found: ${hookName}`);
    }

    this.logger.debug(`Executing hook: ${hookName}`, data);
    
    try {
      const result = await this.executeWithTimeout(
        registration.handler,
        data,
        this.context,
        registration.options.timeout || 5000
      );
      
      this.logger.debug(`Hook executed successfully: ${hookName}`, result);
      this.emit('hook:executed', { hookName, result });
      return result;
      
    } catch (error) {
      this.logger.error(`Hook execution failed: ${hookName}`, error as Error, data);
      this.emit('hook:error', { hookName, error, data });
      
      if (registration.options.fallback) {
        return this.handleHookFallback(hookName, data, error as Error);
      }
      
      throw error;
    }
  }

  /**
   * Create plugin manifest
   */
  createManifest(additionalData: Partial<PluginManifest> = {}): PluginManifest {
    const manifest: PluginManifest = {
      id: this.config.pluginId,
      name: this.config.pluginName,
      version: this.config.version,
      permissions: this.config.permissions,
      hooks: Array.from(this.hooks.keys()),
      ...additionalData
    };

    this.logger.debug('Created plugin manifest', manifest);
    return manifest;
  }

  /**
   * Get plugin context
   */
  getContext(): PluginContext {
    return { ...this.context };
  }

  /**
   * Get plugin configuration
   */
  getConfig(): Record<string, any> {
    return { ...this.context.config };
  }

  /**
   * Update plugin configuration
   */
  async updateConfig(updates: Record<string, any>): Promise<void> {
    this.context.config = { ...this.context.config, ...updates };
    await this.saveConfiguration();
    this.emit('config:updated', this.context.config);
  }

  /**
   * Check if plugin has permission
   */
  hasPermission(permission: string): boolean {
    return this.config.permissions.includes(permission);
  }

  /**
   * Validate permissions
   */
  async validatePermissions(): Promise<void> {
    this.logger.debug('Validating permissions', this.config.permissions);
    
    // In a real implementation, this would validate against the platform's permission system
    for (const permission of this.config.permissions) {
      if (!this.isValidPermission(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }
    
    this.logger.debug('Permissions validated successfully');
  }

  /**
   * Create logger instance
   */
  private createLogger(): PluginLogger {
    return {
      info: (message: string, data?: any) => {
        console.log(`[${this.config.pluginId}] INFO: ${message}`, data || '');
      },
      warn: (message: string, data?: any) => {
        console.warn(`[${this.config.pluginId}] WARN: ${message}`, data || '');
      },
      error: (message: string, error?: Error, data?: any) => {
        console.error(`[${this.config.pluginId}] ERROR: ${message}`, error || '', data || '');
      },
      debug: (message: string, data?: any) => {
        if (this.config.debug) {
          console.debug(`[${this.config.pluginId}] DEBUG: ${message}`, data || '');
        }
      }
    };
  }

  /**
   * Create API client
   */
  private createAPI(): PluginAPI {
    const baseURL = process.env.PLATFORM_API_URL || 'http://localhost:3000/api';
    
    const request = async (endpoint: string, options: APIRequestOptions = {}): Promise<any> => {
      const url = `${baseURL}${endpoint}`;
      const method = options.method || 'GET';

      this.logger.debug(`API Request: ${method} ${url}`, options);

      try {
        // In a real implementation, this would make actual HTTP requests
        // For now, we'll simulate API responses
        return this.simulateAPIResponse(endpoint, options);
      } catch (error) {
        this.logger.error(`API Request failed: ${method} ${url}`, error as Error);
        throw error;
      }
    };

    return {
      request,
      get: (endpoint: string, params?: Record<string, any>) => request(endpoint, { method: 'GET', params }),
      post: (endpoint: string, data?: any, headers?: Record<string, string>) => 
        request(endpoint, { method: 'POST', data, headers }),
      put: (endpoint: string, data?: any, headers?: Record<string, string>) => 
        request(endpoint, { method: 'PUT', data, headers }),
      delete: (endpoint: string, headers?: Record<string, string>) => 
        request(endpoint, { method: 'DELETE', headers })
    };
  }

  /**
   * Create storage client
   */
  private createStorage(): PluginStorage {
    const storagePath = path.join(process.cwd(), '.plugin-data', this.config.pluginId);
    
    return {
      get: async (key: string): Promise<any> => {
        try {
          const filePath = path.join(storagePath, `${key}.json`);
          const data = await fs.readFile(filePath, 'utf8');
          return JSON.parse(data);
        } catch (error) {
          return null;
        }
      },
      
      set: async (key: string, value: any): Promise<void> => {
        await fs.mkdir(storagePath, { recursive: true });
        const filePath = path.join(storagePath, `${key}.json`);
        await fs.writeFile(filePath, JSON.stringify(value, null, 2));
      },
      
      delete: async (key: string): Promise<void> => {
        const filePath = path.join(storagePath, `${key}.json`);
        await fs.unlink(filePath).catch(() => {});
      },
      
      list: async (prefix?: string): Promise<string[]> => {
        try {
          const files = await fs.readdir(storagePath);
          const jsonFiles = files.filter(f => f.endsWith('.json'));
          const keys = jsonFiles.map(f => f.replace('.json', ''));
          return prefix ? keys.filter(k => k.startsWith(prefix)) : keys;
        } catch (error) {
          return [];
        }
      },
      
      clear: async (): Promise<void> => {
        try {
          await fs.rmdir(storagePath, { recursive: true });
        } catch (error) {
          // Ignore errors
        }
      }
    };
  }

  /**
   * Create event bus
   */
  private createEventBus(): PluginEventBus {
    return {
      on: (event: string, handler: (...args: any[]) => void) => this.on(event, handler),
      off: (event: string, handler: (...args: any[]) => void) => this.off(event, handler),
      emit: (event: string, data?: any) => this.emit(event, data),
      once: (event: string, handler: (...args: any[]) => void) => this.once(event, handler)
    };
  }

  /**
   * Load plugin configuration
   */
  private async loadConfiguration(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'plugin.config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.context.config = JSON.parse(configData);
      this.logger.debug('Loaded plugin configuration', this.context.config);
    } catch (error) {
      this.logger.debug('No plugin configuration found, using defaults');
      this.context.config = {};
    }
  }

  /**
   * Save plugin configuration
   */
  private async saveConfiguration(): Promise<void> {
    const configPath = path.join(process.cwd(), 'plugin.config.json');
    await fs.writeFile(configPath, JSON.stringify(this.context.config, null, 2));
    this.logger.debug('Saved plugin configuration');
  }

  /**
   * Register default hooks
   */
  private async registerDefaultHooks(): Promise<void> {
    // Register any default hooks that all plugins should have
    this.logger.debug('Registering default hooks');
  }

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout(
    fn: Function,
    data: any,
    context: PluginContext,
    timeout: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Hook execution timed out after ${timeout}ms`));
      }, timeout);

      Promise.resolve(fn(data, context))
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  /**
   * Handle hook fallback
   */
  private handleHookFallback(hookName: string, data: any, error: Error): any {
    this.logger.debug(`Handling fallback for hook: ${hookName}`, error);
    
    // Return safe fallback data
    return {
      success: false,
      error: error.message,
      fallback: true,
      data
    };
  }

  /**
   * Check if permission is valid
   */
  private isValidPermission(permission: string): boolean {
    // In a real implementation, this would check against a permission schema
    const validPermissions = [
      'payment.process', 'payment.refund', 'analytics.read', 'analytics.write',
      'email.send', 'email.template', 'user.read', 'user.write', 'user.tracking',
      'transaction.write', 'customer.read', 'customer.write', 'audience.manage',
      'campaign.manage', 'event.tracking', 'plugin.config', 'plugin.storage',
      'plugin.api', 'plugin.hooks', 'system.info', 'system.health'
    ];
    
    return validPermissions.includes(permission);
  }

  /**
   * Simulate API response (for development/testing)
   */
  private simulateAPIResponse(endpoint: string, options: APIRequestOptions): any {
    // Simulate different API endpoints
    if (endpoint.includes('/payments')) {
      return {
        success: true,
        transactionId: 'txn_' + Math.random().toString(36).substr(2, 9),
        status: 'completed'
      };
    }
    
    if (endpoint.includes('/analytics')) {
      return {
        success: true,
        data: {
          views: Math.floor(Math.random() * 1000),
          clicks: Math.floor(Math.random() * 100),
          conversions: Math.floor(Math.random() * 10)
        }
      };
    }
    
    if (endpoint.includes('/users')) {
      return {
        success: true,
        userId: 'user_' + Math.random().toString(36).substr(2, 9),
        email: 'user@example.com'
      };
    }
    
    return {
      success: true,
      message: 'API request simulated',
      endpoint,
      options
    };
  }
}