// ============================================================
// MnbaraPlugin - Base class for all plugins
// ============================================================

import {
  PluginContext,
  Logger,
  HookRegistry,
  EventBus,
  ServiceAccess,
  DatabaseAccess
} from './types';

/**
 * Base class for all Mnbara plugins
 * 
 * Example:
 * ```typescript
 * export default class MyPlugin extends MnbaraPlugin {
 *   getName() {
 *     return '@mnbara/my-plugin';
 *   }
 * 
 *   getVersion() {
 *     return '1.0.0';
 *   }
 * 
 *   async initialize() {
 *     // Register hooks
 *     this.registerHook('payment.process', this.handlePayment.bind(this));
 *     
 *     // Emit events
 *     this.emit('plugin.initialized', { pluginId: this.context.pluginId });
 *   }
 * 
 *   async handlePayment(data: any) {
 *     // Process payment
 *     return { success: true };
 *   }
 * 
 *   async destroy() {
 *     // Cleanup
 *   }
 * }
 * ```
 */
export abstract class MnbaraPlugin {
  protected context: PluginContext;

  constructor(context: PluginContext) {
    this.context = context;
  }

  // ============================================================
  // Required Methods (must be implemented by plugins)
  // ============================================================

  /**
   * Get plugin name (must be scoped, e.g., @mnbara/plugin-name)
   */
  abstract getName(): string;

  /**
   * Get plugin version (semantic versioning, e.g., 1.0.0)
   */
  abstract getVersion(): string;

  /**
   * Initialize plugin (called when plugin is loaded)
   */
  abstract initialize(): Promise<void>;

  /**
   * Destroy plugin (called when plugin is unloaded)
   */
  abstract destroy(): Promise<void>;

  // ============================================================
  // Helper Methods (available to all plugins)
  // ============================================================

  /**
   * Get plugin configuration
   */
  protected getConfig<T = any>(key: string, defaultValue?: T): T {
    return this.context.config[key] ?? defaultValue;
  }

  /**
   * Get logger instance
   */
  protected getLogger(): Logger {
    return this.context.logger;
  }

  /**
   * Register a hook
   */
  protected registerHook(
    hookName: string,
    handler: Function,
    priority: number = 100
  ): void {
    this.context.hooks.register(hookName, handler, priority);
    this.getLogger().info(`Hook registered: ${hookName}`, {
      pluginId: this.context.pluginId,
      priority
    });
  }

  /**
   * Unregister a hook
   */
  protected unregisterHook(hookName: string, handler: Function): void {
    this.context.hooks.unregister(hookName, handler);
    this.getLogger().info(`Hook unregistered: ${hookName}`, {
      pluginId: this.context.pluginId
    });
  }

  /**
   * Emit an event
   */
  protected emit(eventName: string, data: any): void {
    this.context.events.emit(eventName, {
      ...data,
      pluginId: this.context.pluginId,
      timestamp: new Date()
    });
    this.getLogger().debug(`Event emitted: ${eventName}`, {
      pluginId: this.context.pluginId
    });
  }

  /**
   * Subscribe to an event
   */
  protected on(eventName: string, handler: Function): void {
    this.context.events.on(eventName, handler);
    this.getLogger().debug(`Event subscribed: ${eventName}`, {
      pluginId: this.context.pluginId
    });
  }

  /**
   * Unsubscribe from an event
   */
  protected off(eventName: string, handler: Function): void {
    this.context.events.off(eventName, handler);
    this.getLogger().debug(`Event unsubscribed: ${eventName}`, {
      pluginId: this.context.pluginId
    });
  }

  /**
   * Get a service
   */
  protected getService<T>(serviceName: string): T {
    if (!this.context.services.has(serviceName)) {
      throw new Error(`Service not found: ${serviceName}`);
    }
    return this.context.services.get<T>(serviceName);
  }

  /**
   * Execute database query (with permission check)
   */
  protected async query(sql: string, params?: any[]): Promise<any> {
    return this.context.database.query(sql, params);
  }

  /**
   * Execute database transaction
   */
  protected async transaction<T>(
    callback: (tx: any) => Promise<T>
  ): Promise<T> {
    return this.context.database.transaction(callback);
  }

  /**
   * Log debug message
   */
  protected debug(message: string, meta?: any): void {
    this.getLogger().debug(message, { pluginId: this.context.pluginId, ...meta });
  }

  /**
   * Log info message
   */
  protected info(message: string, meta?: any): void {
    this.getLogger().info(message, { pluginId: this.context.pluginId, ...meta });
  }

  /**
   * Log warning message
   */
  protected warn(message: string, meta?: any): void {
    this.getLogger().warn(message, { pluginId: this.context.pluginId, ...meta });
  }

  /**
   * Log error message
   */
  protected error(message: string, error?: Error, meta?: any): void {
    this.getLogger().error(message, error, { pluginId: this.context.pluginId, ...meta });
  }
}

