/**
 * MNBara Plugin SDK Core
 * 
 * Main PluginSDK class that provides the core functionality for plugin development
 */

import { EventEmitter } from 'events';
import { PluginLogger, DefaultPluginLogger } from '../utils/logger';
import { PluginError, PluginErrorCode } from '../utils/errors';
import { PluginValidator, DefaultPluginValidator } from '../utils/validator';
import { PluginSecurity, DefaultPluginSecurity } from '../utils/security';
import { PluginStorage, DefaultPluginStorage, MemoryStorage } from '../utils/storage';
import { PluginCache, TTLCache, CacheStrategy } from '../utils/cache';
import { PluginMetricsCollector, DefaultPluginMetricsCollector } from '../utils/metrics';
import {
  PluginMetadata,
  PluginManifest,
  PluginConfiguration,
  PluginState,
  PluginPermissions
} from '../types/plugin-types';
import { WalletContext } from '../types/wallet-types';
import { HookContext } from '../types/hook-types';
import { ApiContext } from '../types/api-types';
import { UIContext } from '../types/ui-types';

/**
 * Plugin context interface
 */
export interface PluginContext {
  metadata: PluginMetadata;
  manifest: PluginManifest;
  configuration: PluginConfiguration;
  permissions: PluginPermissions;
  state: PluginState;
  
  // Core services
  logger: PluginLogger;
  validator: PluginValidator;
  security: PluginSecurity;
  storage: PluginStorage;
  cache: PluginCache;
  metrics: PluginMetricsCollector;
  
  // Integration contexts
  wallet?: WalletContext;
  hooks?: HookContext;
  api?: ApiContext;
  ui?: UIContext;
  
  // Event emitter
  events: EventEmitter;
  
  // Utility methods
  log: (level: string, message: string, meta?: any) => void;
  validate: (data: any, schema: any) => boolean;
  checkPermission: (permission: string) => boolean;
  getConfig: (key?: string) => any;
  setConfig: (key: string, value: any) => void;
  emit: (event: string, ...args: any[]) => boolean;
  on: (event: string, listener: (...args: any[]) => void) => EventEmitter;
  off: (event: string, listener: (...args: any[]) => void) => EventEmitter;
}

/**
 * Plugin configuration interface
 */
export interface PluginConfig {
  metadata: PluginMetadata;
  manifest: PluginManifest;
  configuration?: PluginConfiguration;
  context?: Partial<PluginContext>;
}

/**
 * Main Plugin SDK class
 */
export class PluginSDK {
  private context!: PluginContext;
  private initialized: boolean = false;
  private logger: PluginLogger;
  
  constructor(config: PluginConfig) {
    this.logger = new DefaultPluginLogger({ pluginId: config.metadata.id });
    this.initializeContext(config);
  }
  
  /**
   * Initialize the plugin context
   */
  private initializeContext(config: PluginConfig): void {
    const { metadata, manifest, configuration = {} } = config;
    
    // Create base context
    this.context = {
      metadata,
      manifest,
      configuration,
      permissions: manifest.permissions,
      state: {
        status: 'installed',
        metadata,
        manifest,
        installedAt: new Date(),
        updatedAt: new Date(),
        activationCount: 0,
        health: {
          status: 'unknown',
          lastCheck: new Date(),
          checks: {
            memory: { status: 'warn', message: 'Not checked', timestamp: new Date() },
            cpu: { status: 'warn', message: 'Not checked', timestamp: new Date() },
            network: { status: 'warn', message: 'Not checked', timestamp: new Date() },
            storage: { status: 'warn', message: 'Not checked', timestamp: new Date() },
            dependencies: { status: 'warn', message: 'Not checked', timestamp: new Date() }
          },
          errors: [],
          warnings: []
        },
        metrics: {
          activations: 0,
          deactivations: 0,
          errors: 0,
          warnings: 0,
          apiCalls: 0,
          walletOperations: 0,
          uiInteractions: 0,
          hookExecutions: 0,
          storageOperations: 0,
          networkRequests: 0,
          responseTime: {
            avg: 0,
            min: 0,
            max: 0,
            p95: 0
          },
          memoryUsage: {
            current: 0,
            peak: 0,
            avg: 0
          },
          cpuUsage: {
            current: 0,
            peak: 0,
            avg: 0
          }
        }
      },
      
      // Core services
      logger: this.logger,
      validator: new DefaultPluginValidator(),
      security: new DefaultPluginSecurity(),
      storage: new DefaultPluginStorage(new MemoryStorage(), metadata.id),
      cache: new TTLCache({ strategy: CacheStrategy.LRU, maxSize: 1000, maxAge: 3600000 }),
      metrics: new DefaultPluginMetricsCollector({ tags: { pluginId: metadata.id } }),
      
      // Event emitter
      events: new EventEmitter(),
      
      // Utility methods
      log: this.log.bind(this),
      validate: this.validate.bind(this),
      checkPermission: this.checkPermission.bind(this),
      getConfig: this.getConfig.bind(this),
      setConfig: this.setConfig.bind(this),
      emit: this.emit.bind(this),
      on: this.on.bind(this),
      off: this.off.bind(this)
    };
    
    // Apply custom context from config
    if (config.context) {
      Object.assign(this.context, config.context);
    }
  }
  
  /**
   * Initialize the plugin SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      throw new PluginError(
        PluginErrorCode.ALREADY_INITIALIZED,
        'Plugin SDK is already initialized'
      );
    }
    
    try {
      this.logger.info('Initializing plugin SDK', {
        pluginId: this.context.metadata.id,
        version: this.context.metadata.version
      });
      
      // Initialize core services
      await this.initializeServices();
      
      // Validate plugin configuration
      await this.validateConfiguration();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.initialized = true;
      this.context.state.status = 'enabled';
      this.context.state.lastActivatedAt = new Date();
      this.context.state.activationCount++;
      
      this.logger.info('Plugin SDK initialized successfully', {
        pluginId: this.context.metadata.id
      });
      
      // Emit initialization event
      this.context.events.emit('plugin:initialized', this.context);
      
    } catch (error) {
      this.logger.error('Failed to initialize plugin SDK', {
        pluginId: this.context.metadata.id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new PluginError(
        PluginErrorCode.INITIALIZATION_FAILED,
        'Failed to initialize plugin SDK',
        { originalError: error instanceof Error ? error : new Error(String(error)) }
      );
    }
  }
  
  /**
   * Initialize core services
   */
  private async initializeServices(): Promise<void> {
    // Security is already initialized in constructor
  }
  
  /**
   * Validate plugin configuration
   */
  private async validateConfiguration(): Promise<void> {
    const validator = this.context.validator;
    
    // Basic validation - just check if required fields exist
    if (!this.context.metadata || !this.context.metadata.id || !this.context.metadata.name) {
      throw new PluginError(
        PluginErrorCode.VALIDATION_FAILED,
        'Invalid plugin metadata',
        { context: { errors: ['Plugin metadata is missing required fields'] } }
      );
    }
    
    if (!this.context.manifest || !this.context.manifest.metadata || !this.context.manifest.entry) {
      throw new PluginError(
        PluginErrorCode.VALIDATION_FAILED,
        'Invalid plugin manifest',
        { context: { errors: ['Plugin manifest is missing metadata or entry'] } }
      );
    }
    
    if (!this.context.permissions) {
      throw new PluginError(
        PluginErrorCode.VALIDATION_FAILED,
        'Invalid plugin permissions',
        { context: { errors: ['Plugin permissions are missing'] } }
      );
    }
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for plugin lifecycle events
    this.context.events.on('plugin:enable', this.onEnable.bind(this));
    this.context.events.on('plugin:disable', this.onDisable.bind(this));
    this.context.events.on('plugin:uninstall', this.onUninstall.bind(this));
    
    // Listen for error events
    this.context.events.on('error', this.onError.bind(this));
  }
  
  /**
   * Get the plugin context
   */
  getContext(): PluginContext {
    if (!this.initialized) {
      throw new PluginError(
        PluginErrorCode.NOT_INITIALIZED,
        'Plugin SDK is not initialized'
      );
    }
    
    return this.context;
  }
  
  /**
   * Log a message
   */
  private log(level: string, message: string, meta?: any): void {
    this.logger.log(level, message, meta);
  }
  
  /**
   * Validate data against a schema
   */
  private validate(data: any, schema: any): boolean {
    const result = this.context.validator.validate(data, schema);
    return result && result.valid !== false;
  }
  
  /**
   * Check if plugin has a specific permission
   */
  private checkPermission(permission: string): boolean {
    return this.context.security.checkPermission(permission, this.context.permissions);
  }
  
  /**
   * Get configuration value
   */
  private getConfig(key?: string): any {
    if (key) {
      return this.context.configuration.settings?.[key];
    }
    return this.context.configuration;
  }
  
  /**
   * Set configuration value
   */
  private setConfig(key: string, value: any): void {
    if (!this.context.configuration.settings) {
      this.context.configuration.settings = {};
    }
    this.context.configuration.settings[key] = value;
  }
  
  /**
   * Emit an event
   */
  private emit(event: string, ...args: any[]): boolean {
    return this.context.events.emit(event, ...args);
  }
  
  /**
   * Listen for an event
   */
  private on(event: string, listener: (...args: any[]) => void): EventEmitter {
    return this.context.events.on(event, listener);
  }
  
  /**
   * Remove event listener
   */
  private off(event: string, listener: (...args: any[]) => void): EventEmitter {
    return this.context.events.off(event, listener);
  }
  
  /**
   * Handle plugin enable event
   */
  private async onEnable(): Promise<void> {
    this.logger.info('Plugin enabled', {
      pluginId: this.context.metadata.id
    });
    
    this.context.state.status = 'enabled';
    this.context.state.lastActivatedAt = new Date();
    this.context.state.activationCount++;
  }
  
  /**
   * Handle plugin disable event
   */
  private async onDisable(): Promise<void> {
    this.logger.info('Plugin disabled', {
      pluginId: this.context.metadata.id
    });
    
    this.context.state.status = 'disabled';
    this.context.state.lastDeactivatedAt = new Date();
  }
  
  /**
   * Handle plugin uninstall event
   */
  private async onUninstall(): Promise<void> {
    this.logger.info('Plugin uninstalled', {
      pluginId: this.context.metadata.id
    });
    
    this.context.state.status = 'uninstalled';
    
    // Clean up resources
    await this.cleanup();
  }
  
  /**
   * Handle plugin error
   */
  private async onError(error: Error): Promise<void> {
    this.logger.error('Plugin error', {
      pluginId: this.context.metadata.id,
      error: error.message,
      stack: error.stack
    });
    
    this.context.state.status = 'error';
    this.context.state.error = error.message;
    
    // Update metrics
    this.context.state.metrics.errors++;
  }
  
  /**
   * Clean up resources
   */
  private async cleanup(): Promise<void> {
    try {
      // Clear storage and cache
      await this.context.storage.clear();
      await this.context.cache.clear();
      
      // Remove all event listeners
      this.context.events.removeAllListeners();
      
      this.logger.info('Plugin cleanup completed', {
        pluginId: this.context.metadata.id
      });
    } catch (error) {
      this.logger.error('Error during plugin cleanup', {
        pluginId: this.context.metadata.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Get plugin health status
   */
  async getHealth(): Promise<{
    status: string;
    checks: Record<string, any>;
    errors: any[];
    warnings: string[];
  }> {
    const health = {
      status: this.context.state.health.status,
      checks: this.context.state.health.checks,
      errors: this.context.state.health.errors,
      warnings: this.context.state.health.warnings
    };
    
    return health;
  }
  
  /**
   * Get plugin metrics
   */
  async getMetrics(): Promise<PluginState['metrics']> {
    return this.context.state.metrics;
  }
  
  /**
   * Update plugin configuration
   */
  async updateConfiguration(configuration: Partial<PluginConfiguration>): Promise<void> {
    this.context.configuration = {
      ...this.context.configuration,
      ...configuration
    };
    
    this.context.state.updatedAt = new Date();
    
    this.logger.info('Plugin configuration updated', {
      pluginId: this.context.metadata.id
    });
  }
  
  /**
   * Shutdown the plugin SDK
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    this.logger.info('Shutting down plugin SDK', {
      pluginId: this.context.metadata.id
    });
    
    await this.cleanup();
    
    this.initialized = false;
    this.context.state.status = 'disabled';
    
    this.logger.info('Plugin SDK shutdown completed', {
      pluginId: this.context.metadata.id
    });
  }
}