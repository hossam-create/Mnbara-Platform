/**
 * Plugin Hook System
 * 
 * Event-driven hook system for MNBara plugins
 */

import { PluginContext } from '../types/plugin-types';

export enum HookType {
  // Wallet hooks
  WALLET_CONNECTED = 'wallet:connected',
  WALLET_DISCONNECTED = 'wallet:disconnected',
  WALLET_ACCOUNT_CHANGED = 'wallet:account-changed',
  WALLET_CHAIN_CHANGED = 'wallet:chain-changed',
  WALLET_TRANSACTION_SENT = 'wallet:transaction-sent',
  WALLET_TRANSACTION_CONFIRMED = 'wallet:transaction-confirmed',
  WALLET_TRANSACTION_FAILED = 'wallet:transaction-failed',
  WALLET_BALANCE_CHANGED = 'wallet:balance-changed',
  
  // UI hooks
  UI_MOUNTED = 'ui:mounted',
  UI_UNMOUNTED = 'ui:unmounted',
  UI_UPDATED = 'ui:updated',
  UI_NAVIGATED = 'ui:navigated',
  UI_ERROR = 'ui:error',
  UI_LOADING = 'ui:loading',
  UI_READY = 'ui:ready',
  
  // API hooks
  API_REQUEST_STARTED = 'api:request-started',
  API_REQUEST_COMPLETED = 'api:request-completed',
  API_REQUEST_FAILED = 'api:request-failed',
  API_RESPONSE_RECEIVED = 'api:response-received',
  API_RATE_LIMITED = 'api:rate-limited',
  
  // Plugin hooks
  PLUGIN_INSTALLED = 'plugin:installed',
  PLUGIN_UNINSTALLED = 'plugin:uninstalled',
  PLUGIN_ENABLED = 'plugin:enabled',
  PLUGIN_DISABLED = 'plugin:disabled',
  PLUGIN_UPDATED = 'plugin:updated',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_INITIALIZED = 'plugin:initialized',
  PLUGIN_DESTROYED = 'plugin:destroyed',
  
  // System hooks
  SYSTEM_STARTUP = 'system:startup',
  SYSTEM_SHUTDOWN = 'system:shutdown',
  SYSTEM_ERROR = 'system:error',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  SYSTEM_UPDATE = 'system:update',
  
  // Custom hooks
  CUSTOM = 'custom'
}

export interface HookEvent {
  type: HookType | string;
  payload?: any;
  source?: string;
  timestamp: Date;
  id: string;
  priority?: number;
  context?: PluginContext;
  metadata?: Record<string, any>;
}

export interface HookHandler {
  (event: HookEvent): void | Promise<void>;
}

export interface HookFilter {
  (event: HookEvent): boolean;
}

export interface HookMiddleware {
  (event: HookEvent, next: () => void | Promise<void>): void | Promise<void>;
}

export interface HookSubscription {
  id: string;
  type: HookType | string;
  handler: HookHandler;
  filter?: HookFilter;
  priority: number;
  once: boolean;
  source?: string;
  metadata?: Record<string, any>;
}

export interface HookContext {
  pluginId: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface HookSystem {
  // Event emission
  emit: (type: HookType | string, payload?: any, context?: HookContext) => Promise<void>;
  emitSync: (type: HookType | string, payload?: any, context?: HookContext) => void;
  
  // Event subscription
  on: (type: HookType | string, handler: HookHandler, options?: HookOptions) => string;
  once: (type: HookType | string, handler: HookHandler, options?: HookOptions) => string;
  off: (id: string) => boolean;
  offAll: (type?: HookType | string) => number;
  
  // Event filtering
  filter: (type: HookType | string, filter: HookFilter, handler: HookHandler, options?: HookOptions) => string;
  
  // Middleware
  use: (middleware: HookMiddleware) => void;
  removeMiddleware: (middleware: HookMiddleware) => boolean;
  
  // Event querying
  getSubscriptions: (type?: HookType | string) => HookSubscription[];
  getSubscription: (id: string) => HookSubscription | undefined;
  hasSubscriptions: (type: HookType | string) => boolean;
  
  // Event history
  getHistory: (options?: HistoryOptions) => HookEvent[];
  clearHistory: () => void;
  getHistorySize: () => number;
  
  // Statistics
  getStats: () => HookStats;
  resetStats: () => void;
  
  // Lifecycle
  initialize: () => Promise<void>;
  destroy: () => Promise<void>;
  
  // Configuration
  configure: (options: HookSystemOptions) => void;
  getOptions: () => HookSystemOptions;
}

export interface HookOptions {
  priority?: number;
  filter?: HookFilter;
  once?: boolean;
  source?: string;
  metadata?: Record<string, any>;
}

export interface HistoryOptions {
  type?: HookType | string;
  source?: string;
  limit?: number;
  since?: Date;
  until?: Date;
  reverse?: boolean;
}

export interface HookStats {
  totalEmitted: number;
  totalHandled: number;
  totalErrors: number;
  activeSubscriptions: number;
  totalSubscriptions: number;
  middlewareCount: number;
  historySize: number;
  eventTypes: Record<string, number>;
  averageProcessingTime: number;
  errorRate: number;
}

export interface HookSystemOptions {
  maxHistorySize: number;
  enableHistory: boolean;
  enableStats: boolean;
  enableMiddleware: boolean;
  maxSubscriptionsPerType: number;
  defaultPriority: number;
  enableAsync: boolean;
  timeout: number;
}

export class DefaultHookSystem implements HookSystem {
  private subscriptions: Map<string, HookSubscription> = new Map();
  private subscriptionsByType: Map<string, Set<string>> = new Map();
  private middleware: HookMiddleware[] = [];
  private history: HookEvent[] = [];
  private stats: HookStats;
  private options: HookSystemOptions;
  private initialized: boolean = false;
  private cache: Map<string, { expiresAt: Date }> = new Map();

  constructor(options?: Partial<HookSystemOptions>) {
    this.options = {
      maxHistorySize: 10000,
      enableHistory: true,
      enableStats: true,
      enableMiddleware: true,
      maxSubscriptionsPerType: 1000,
      defaultPriority: 0,
      enableAsync: true,
      timeout: 30000,
      ...options
    };

    this.stats = {
      totalEmitted: 0,
      totalHandled: 0,
      totalErrors: 0,
      activeSubscriptions: 0,
      totalSubscriptions: 0,
      middlewareCount: 0,
      historySize: 0,
      eventTypes: {},
      averageProcessingTime: 0,
      errorRate: 0
    };
  }

  async emit(type: HookType | string, payload?: any, context?: HookContext): Promise<void> {
    if (!this.initialized) {
      throw new Error('HookSystem not initialized');
    }

    const event = this.createEvent(type, payload, context);
    
    if (this.options.enableHistory) {
      this.addToHistory(event);
    }

    if (this.options.enableStats) {
      this.updateStats('emit', type);
    }

    const subscriptions = this.getRelevantSubscriptions(type);
    
    if (this.options.enableMiddleware && this.middleware.length > 0) {
      await this.processWithMiddleware(event, subscriptions);
    } else {
      await this.processSubscriptions(event, subscriptions);
    }
  }

  emitSync(type: HookType | string, payload?: any, context?: HookContext): void {
    if (!this.initialized) {
      throw new Error('HookSystem not initialized');
    }

    const event = this.createEvent(type, payload, context);
    
    if (this.options.enableHistory) {
      this.addToHistory(event);
    }

    if (this.options.enableStats) {
      this.updateStats('emit', type);
    }

    const subscriptions = this.getRelevantSubscriptions(type);
    
    // Process synchronously without middleware
    for (const subscription of subscriptions) {
      try {
        if (this.shouldProcessSubscription(subscription, event)) {
          subscription.handler(event);
          
          if (subscription.once) {
            this.off(subscription.id);
          }
        }
      } catch (error) {
        this.handleError(error, subscription, event);
      }
    }
  }

  on(type: HookType | string, handler: HookHandler, options?: HookOptions): string {
    return this.addSubscription(type, handler, {
      ...options,
      once: false
    });
  }

  once(type: HookType | string, handler: HookHandler, options?: HookOptions): string {
    return this.addSubscription(type, handler, {
      ...options,
      once: true
    });
  }

  off(id: string): boolean {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      return false;
    }

    this.subscriptions.delete(id);
    
    const typeSubscriptions = this.subscriptionsByType.get(subscription.type);
    if (typeSubscriptions) {
      typeSubscriptions.delete(id);
      if (typeSubscriptions.size === 0) {
        this.subscriptionsByType.delete(subscription.type);
      }
    }

    this.stats.activeSubscriptions--;
    return true;
  }

  offAll(type?: HookType | string): number {
    let removed = 0;
    
    if (type) {
      const typeSubscriptions = this.subscriptionsByType.get(type);
      if (typeSubscriptions) {
        for (const id of typeSubscriptions) {
          if (this.off(id)) {
            removed++;
          }
        }
      }
    } else {
      removed = this.subscriptions.size;
      this.subscriptions.clear();
      this.subscriptionsByType.clear();
      this.stats.activeSubscriptions = 0;
    }

    return removed;
  }

  filter(type: HookType | string, filter: HookFilter, handler: HookHandler, options?: HookOptions): string {
    return this.addSubscription(type, handler, {
      ...options,
      filter
    });
  }

  use(middleware: HookMiddleware): void {
    if (this.options.enableMiddleware) {
      this.middleware.push(middleware);
      this.stats.middlewareCount = this.middleware.length;
    }
  }

  removeMiddleware(middleware: HookMiddleware): boolean {
    const index = this.middleware.indexOf(middleware);
    if (index !== -1) {
      this.middleware.splice(index, 1);
      this.stats.middlewareCount = this.middleware.length;
      return true;
    }
    return false;
  }

  getSubscriptions(type?: HookType | string): HookSubscription[] {
    if (type) {
      const typeSubscriptions = this.subscriptionsByType.get(type);
      if (!typeSubscriptions) {
        return [];
      }
      return Array.from(typeSubscriptions)
        .map(id => this.subscriptions.get(id)!)
        .filter(Boolean);
    }
    
    return Array.from(this.subscriptions.values());
  }

  getSubscription(id: string): HookSubscription | undefined {
    return this.subscriptions.get(id);
  }

  hasSubscriptions(type: HookType | string): boolean {
    const typeSubscriptions = this.subscriptionsByType.get(type);
    return typeSubscriptions ? typeSubscriptions.size > 0 : false;
  }

  getHistory(options?: HistoryOptions): HookEvent[] {
    if (!this.options.enableHistory) {
      return [];
    }

    let history = [...this.history];

    if (options) {
      if (options.type) {
        history = history.filter(event => event.type === options.type);
      }
      
      if (options.source) {
        history = history.filter(event => event.source === options.source);
      }
      
      if (options.since) {
        history = history.filter(event => event.timestamp >= options.since!);
      }
      
      if (options.until) {
        history = history.filter(event => event.timestamp <= options.until!);
      }
      
      if (options.limit && options.limit > 0) {
        history = history.slice(0, options.limit);
      }
      
      if (options.reverse) {
        history.reverse();
      }
    }

    return history;
  }

  clearHistory(): void {
    this.history = [];
    this.stats.historySize = 0;
  }

  getHistorySize(): number {
    return this.history.length;
  }

  getStats(): HookStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      totalEmitted: 0,
      totalHandled: 0,
      totalErrors: 0,
      activeSubscriptions: this.subscriptions.size,
      totalSubscriptions: this.stats.totalSubscriptions,
      middlewareCount: this.middleware.length,
      historySize: this.history.length,
      eventTypes: {},
      averageProcessingTime: 0,
      errorRate: 0
    };
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize any required resources
    this.initialized = true;
  }

  async destroy(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    // Clear all subscriptions
    this.offAll();
    
    // Clear history
    this.clearHistory();
    
    // Reset stats
    this.resetStats();
    
    // Clear middleware
    this.middleware = [];
    
    this.initialized = false;
  }

  configure(options: HookSystemOptions): void {
    this.options = options;
  }

  getOptions(): HookSystemOptions {
    return { ...this.options };
  }

  private createEvent(type: HookType | string, payload?: any, context?: HookContext): HookEvent {
    return {
      type,
      payload,
      source: context?.source || 'unknown',
      timestamp: new Date(),
      id: this.generateEventId(),
      priority: 0,
      context: context as any,
      metadata: context?.metadata
    };
  }

  private addToHistory(event: HookEvent): void {
    this.history.push(event);
    
    if (this.history.length > this.options.maxHistorySize) {
      this.history = this.history.slice(-this.options.maxHistorySize);
    }
    
    this.stats.historySize = this.history.length;
  }

  private addSubscription(type: HookType | string, handler: HookHandler, options?: HookOptions): string {
    const id = this.generateSubscriptionId();
    
    const subscription: HookSubscription = {
      id,
      type,
      handler,
      filter: options?.filter,
      priority: options?.priority ?? this.options.defaultPriority,
      once: options?.once ?? false,
      source: options?.source,
      metadata: options?.metadata
    };

    this.subscriptions.set(id, subscription);
    
    if (!this.subscriptionsByType.has(type)) {
      this.subscriptionsByType.set(type, new Set());
    }
    this.subscriptionsByType.get(type)!.add(id);

    this.stats.activeSubscriptions++;
    this.stats.totalSubscriptions++;

    return id;
  }

  private getRelevantSubscriptions(type: HookType | string): HookSubscription[] {
    const typeSubscriptions = this.subscriptionsByType.get(type);
    if (!typeSubscriptions) {
      return [];
    }

    return Array.from(typeSubscriptions)
      .map(id => this.subscriptions.get(id)!)
      .filter(Boolean)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  private shouldProcessSubscription(subscription: HookSubscription, event: HookEvent): boolean {
    if (subscription.filter) {
      return subscription.filter(event);
    }
    return true;
  }

  private async processWithMiddleware(event: HookEvent, subscriptions: HookSubscription[]): Promise<void> {
    let currentIndex = 0;

    const next = async () => {
      if (currentIndex >= this.middleware.length) {
        await this.processSubscriptions(event, subscriptions);
        return;
      }

      const middleware = this.middleware[currentIndex++];
      await middleware(event, next);
    };

    await next();
  }

  private async processSubscriptions(event: HookEvent, subscriptions: HookSubscription[]): Promise<void> {
    const startTime = Date.now();
    
    for (const subscription of subscriptions) {
      try {
        if (this.shouldProcessSubscription(subscription, event)) {
          if (this.options.enableAsync) {
            await this.processSubscriptionAsync(subscription, event);
          } else {
            subscription.handler(event);
          }
          
          if (subscription.once) {
            this.off(subscription.id);
          }
        }
      } catch (error) {
        this.handleError(error, subscription, event);
      }
    }

    if (this.options.enableStats) {
      const processingTime = Date.now() - startTime;
      this.stats.averageProcessingTime = (this.stats.averageProcessingTime + processingTime) / 2;
    }
  }

  private async processSubscriptionAsync(subscription: HookSubscription, event: HookEvent): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Hook handler timeout for subscription ${subscription.id}`));
      }, this.options.timeout);

      try {
        const result = subscription.handler(event);
        
        if (result instanceof Promise) {
          result
            .then(() => {
              clearTimeout(timeout);
              resolve();
            })
            .catch((error) => {
              clearTimeout(timeout);
              reject(error);
            });
        } else {
          clearTimeout(timeout);
          resolve();
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private handleError(error: any, subscription: HookSubscription, event: HookEvent): void {
    this.stats.totalErrors++;
    this.stats.errorRate = this.stats.totalErrors / this.stats.totalHandled;
    
    // Emit error event
    this.emitSync(HookType.PLUGIN_ERROR, {
      error,
      subscription,
      event,
      timestamp: new Date()
    });
  }

  private updateStats(action: string, type: HookType | string): void {
    if (action === 'emit') {
      this.stats.totalEmitted++;
      this.stats.eventTypes[type] = (this.stats.eventTypes[type] || 0) + 1;
    } else if (action === 'handle') {
      this.stats.totalHandled++;
    }
  }

  private cleanupExpired(): void {
    const now = new Date();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      this.cache.delete(key);
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}