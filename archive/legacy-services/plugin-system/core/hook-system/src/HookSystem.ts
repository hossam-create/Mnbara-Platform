/**
 * Hook System
 * 
 * Provides a flexible hook system for plugins to extend application functionality.
 * Supports synchronous and asynchronous hooks, priority-based execution, and
 * comprehensive error handling with fallback mechanisms.
 * 
 * Features:
 * - Hook registration and management
 * - Priority-based execution order
 * - Synchronous and asynchronous hooks
 * - Error handling and recovery
 * - Hook filtering and validation
 * - Performance monitoring
 * 
 * Usage:
 * ```typescript
 * const hookSystem = new HookSystem();
 * 
 * // Register a hook
 * hookSystem.registerHook('payment.process', async (data) => {
 *   // Process payment
 *   return { success: true };
 * });
 * 
 * // Execute hooks
 * const results = await hookSystem.executeHooks('payment.process', { amount: 100 });
 * ```
 */

import { EventEmitter } from 'events';

export interface HookOptions {
  priority?: number;           // Hook execution priority (higher = earlier)
  timeout?: number;           // Hook execution timeout in milliseconds
  retries?: number;           // Number of retries on failure
  fallback?: boolean;         // Whether to continue on failure
  filter?: HookFilter;       // Filter function for hook execution
  metadata?: HookMetadata;   // Additional hook metadata
}

export interface HookFilter {
  (context: HookContext): boolean;
}

export interface HookMetadata {
  plugin?: string;            // Plugin name that registered the hook
  description?: string;       // Hook description
  tags?: string[];           // Hook tags for categorization
  version?: string;         // Hook version
}

export interface HookContext {
  hookName: string;
  data: any;
  metadata: HookMetadata;
  execution: {
    startTime: Date;
    attempt: number;
    timeout?: number;
  };
}

export interface HookResult {
  success: boolean;
  data?: any;
  error?: Error;
  executionTime: number;
  attempts: number;
  metadata: HookMetadata;
}

export interface HookExecutionStats {
  totalHooks: number;
  successfulHooks: number;
  failedHooks: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  slowestHook?: string;
  fastestHook?: string;
}

export type HookHandler = (data: any, context: HookContext) => Promise<any> | any;
export type HookValidator = (data: any) => boolean | Promise<boolean>;

export class HookSystem extends EventEmitter {
  private hooks: Map<string, HookRegistration[]> = new Map();
  private validators: Map<string, HookValidator[]> = new Map();
  private stats: Map<string, HookExecutionStats> = new Map();
  private executionLog: HookExecutionLog[] = [];
  private maxLogSize = 1000;

  constructor(private options: HookSystemOptions = {}) {
    super();
    this.options = {
      defaultTimeout: 5000,
      maxRetries: 3,
      enableStats: true,
      enableLogging: true,
      maxLogSize: 1000,
      ...options,
    };
  }

  /**
   * Register a hook handler
   */
  registerHook(
    hookName: string,
    handler: HookHandler,
    options: HookOptions = {}
  ): string {
    const hookId = this.generateHookId();
    const registration: HookRegistration = {
      id: hookId,
      name: hookName,
      handler,
      options: {
        priority: 100,
        timeout: this.options.defaultTimeout || 5000,
        retries: 0,
        fallback: true,
        ...options,
      },
      registeredAt: new Date(),
    };

    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    const hookList = this.hooks.get(hookName)!;
    hookList.push(registration);
    
    // Sort by priority (higher priority first)
    hookList.sort((a, b) => b.options.priority! - a.options.priority!);

    this.emit('hook:registered', { hookName, hookId, registration });
    
    return hookId;
  }

  /**
   * Unregister a hook
   */
  unregisterHook(hookId: string): boolean {
    for (const [hookName, registrations] of this.hooks.entries()) {
      const index = registrations.findIndex(h => h.id === hookId);
      if (index !== -1) {
        const [removed] = registrations.splice(index, 1);
        this.emit('hook:unregistered', { hookName, hookId, registration: removed });
        return true;
      }
    }
    return false;
  }

  /**
   * Register a hook validator
   */
  registerValidator(hookName: string, validator: HookValidator): string {
    const validatorId = this.generateHookId();
    
    if (!this.validators.has(hookName)) {
      this.validators.set(hookName, []);
    }

    this.validators.get(hookName)!.push(validator);
    
    return validatorId;
  }

  /**
   * Execute hooks for a given name and data
   */
  async executeHooks(
    hookName: string,
    data: any,
    options: HookExecutionOptions = {}
  ): Promise<HookResult[]> {
    const startTime = Date.now();
    const registrations = this.hooks.get(hookName) || [];
    
    // Validate data if validators exist
    if (this.validators.has(hookName)) {
      const validators = this.validators.get(hookName)!;
      for (const validator of validators) {
        const isValid = await validator(data);
        if (!isValid) {
          throw new Error(`Hook validation failed for ${hookName}`);
        }
      }
    }

    const results: HookResult[] = [];
    const executionOptions = { ...this.options, ...options };

    this.emit('hooks:execution:start', { hookName, data, registrations: registrations.length });

    for (const registration of registrations) {
      // Apply filter if provided
      if (registration.options.filter) {
        const context = this.createHookContext(hookName, data, registration);
        if (!registration.options.filter(context)) {
          continue;
        }
      }

      const result = await this.executeSingleHook(registration, data, executionOptions);
      results.push(result);

      // Stop execution if fallback is disabled and hook failed
      if (!result.success && !registration.options.fallback) {
        break;
      }
    }

    const totalExecutionTime = Date.now() - startTime;
    
    if (this.options.enableStats) {
      this.updateStats(hookName, results, totalExecutionTime);
    }

    if (this.options.enableLogging) {
      this.logExecution(hookName, data, results, totalExecutionTime);
    }

    this.emit('hooks:execution:end', { hookName, results, totalExecutionTime });
    
    return results;
  }

  /**
   * Execute a single hook with retry logic
   */
  private async executeSingleHook(
    registration: HookRegistration,
    data: any,
    options: HookExecutionOptions
  ): Promise<HookResult> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts <= (registration.options.retries || 0)) {
      attempts++;
      
      try {
        const context = this.createHookContext(
          registration.name,
          data,
          registration,
          attempts
        );

        // Execute with timeout
        const result = await this.executeWithTimeout(
          registration.handler,
          data,
          context,
          registration.options.timeout || this.options.defaultTimeout!
        );

        const executionTime = Date.now() - startTime;

        return {
          success: true,
          data: result,
          executionTime,
          attempts,
          metadata: registration.options.metadata || {},
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempts <= (registration.options.retries || 0)) {
          // Wait before retry
          await this.delay(Math.pow(2, attempts - 1) * 100);
        }
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: false,
      error: lastError,
      executionTime,
      attempts,
      metadata: registration.options.metadata || {},
    };
  }

  /**
   * Execute hook handler with timeout
   */
  private async executeWithTimeout(
    handler: HookHandler,
    data: any,
    context: HookContext,
    timeout: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Hook execution timed out after ${timeout}ms`));
      }, timeout);

      Promise.resolve(handler(data, context))
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timer));
    });
  }

  /**
   * Create hook execution context
   */
  private createHookContext(
    hookName: string,
    data: any,
    registration: HookRegistration,
    attempt = 1
  ): HookContext {
    return {
      hookName,
      data,
      metadata: registration.options.metadata || {},
      execution: {
        startTime: new Date(),
        attempt,
        timeout: registration.options.timeout,
      },
    };
  }

  /**
   * Get registered hooks
   */
  getHooks(hookName?: string): HookRegistration[] | Map<string, HookRegistration[]> {
    if (hookName) {
      return this.hooks.get(hookName) || [];
    }
    
    return new Map(this.hooks);
  }

  /**
   * Get hook statistics
   */
  getStats(hookName?: string): HookExecutionStats | Map<string, HookExecutionStats> {
    if (hookName) {
      return this.stats.get(hookName) || {
        totalHooks: 0,
        successfulHooks: 0,
        failedHooks: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
      };
    }
    
    return new Map(this.stats);
  }

  /**
   * Get execution log
   */
  getExecutionLog(limit = 100): HookExecutionLog[] {
    return this.executionLog.slice(-limit);
  }

  /**
   * Clear statistics
   */
  clearStats(hookName?: string): void {
    if (hookName) {
      this.stats.delete(hookName);
    } else {
      this.stats.clear();
    }
  }

  /**
   * Clear execution log
   */
  clearExecutionLog(): void {
    this.executionLog = [];
  }

  /**
   * Update statistics
   */
  private updateStats(hookName: string, results: HookResult[], totalExecutionTime: number): void {
    const successfulHooks = results.filter(r => r.success).length;
    const failedHooks = results.filter(r => !r.success).length;
    const averageExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;

    const existingStats = this.stats.get(hookName);
    
    if (existingStats) {
      existingStats.totalHooks += results.length;
      existingStats.successfulHooks += successfulHooks;
      existingStats.failedHooks += failedHooks;
      existingStats.totalExecutionTime += totalExecutionTime;
      existingStats.averageExecutionTime = 
        (existingStats.averageExecutionTime + averageExecutionTime) / 2;
    } else {
      this.stats.set(hookName, {
        totalHooks: results.length,
        successfulHooks,
        failedHooks,
        totalExecutionTime,
        averageExecutionTime,
      });
    }
  }

  /**
   * Log execution
   */
  private logExecution(
    hookName: string,
    data: any,
    results: HookResult[],
    totalExecutionTime: number
  ): void {
    const logEntry: HookExecutionLog = {
      hookName,
      timestamp: new Date(),
      data,
      results,
      totalExecutionTime,
      success: results.every(r => r.success),
    };

    this.executionLog.push(logEntry);
    
    // Maintain log size limit
    if (this.executionLog.length > this.maxLogSize) {
      this.executionLog = this.executionLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Generate unique hook ID
   */
  private generateHookId(): string {
    return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Types and interfaces

interface HookSystemOptions {
  defaultTimeout?: number;
  maxRetries?: number;
  enableStats?: boolean;
  enableLogging?: boolean;
  maxLogSize?: number;
}

interface HookExecutionOptions {
  timeout?: number;
  retries?: number;
}

interface HookRegistration {
  id: string;
  name: string;
  handler: HookHandler;
  options: HookOptions;
  registeredAt: Date;
}

interface HookExecutionLog {
  hookName: string;
  timestamp: Date;
  data: any;
  results: HookResult[];
  totalExecutionTime: number;
  success: boolean;
}