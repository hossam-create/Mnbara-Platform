"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HookSystem = void 0;
const events_1 = require("events");
class HookSystem extends events_1.EventEmitter {
    constructor(options = {}) {
        super();
        this.options = options;
        this.hooks = new Map();
        this.validators = new Map();
        this.stats = new Map();
        this.executionLog = [];
        this.maxLogSize = 1000;
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
    registerHook(hookName, handler, options = {}) {
        const hookId = this.generateHookId();
        const registration = {
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
        const hookList = this.hooks.get(hookName);
        hookList.push(registration);
        // Sort by priority (higher priority first)
        hookList.sort((a, b) => b.options.priority - a.options.priority);
        this.emit('hook:registered', { hookName, hookId, registration });
        return hookId;
    }
    /**
     * Unregister a hook
     */
    unregisterHook(hookId) {
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
    registerValidator(hookName, validator) {
        const validatorId = this.generateHookId();
        if (!this.validators.has(hookName)) {
            this.validators.set(hookName, []);
        }
        this.validators.get(hookName).push(validator);
        return validatorId;
    }
    /**
     * Execute hooks for a given name and data
     */
    async executeHooks(hookName, data, options = {}) {
        const startTime = Date.now();
        const registrations = this.hooks.get(hookName) || [];
        // Validate data if validators exist
        if (this.validators.has(hookName)) {
            const validators = this.validators.get(hookName);
            for (const validator of validators) {
                const isValid = await validator(data);
                if (!isValid) {
                    throw new Error(`Hook validation failed for ${hookName}`);
                }
            }
        }
        const results = [];
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
    async executeSingleHook(registration, data, options) {
        const startTime = Date.now();
        let attempts = 0;
        let lastError;
        while (attempts <= (registration.options.retries || 0)) {
            attempts++;
            try {
                const context = this.createHookContext(registration.name, data, registration, attempts);
                // Execute with timeout
                const result = await this.executeWithTimeout(registration.handler, data, context, registration.options.timeout || this.options.defaultTimeout);
                const executionTime = Date.now() - startTime;
                return {
                    success: true,
                    data: result,
                    executionTime,
                    attempts,
                    metadata: registration.options.metadata || {},
                };
            }
            catch (error) {
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
    async executeWithTimeout(handler, data, context, timeout) {
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
    createHookContext(hookName, data, registration, attempt = 1) {
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
    getHooks(hookName) {
        if (hookName) {
            return this.hooks.get(hookName) || [];
        }
        return new Map(this.hooks);
    }
    /**
     * Get hook statistics
     */
    getStats(hookName) {
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
    getExecutionLog(limit = 100) {
        return this.executionLog.slice(-limit);
    }
    /**
     * Clear statistics
     */
    clearStats(hookName) {
        if (hookName) {
            this.stats.delete(hookName);
        }
        else {
            this.stats.clear();
        }
    }
    /**
     * Clear execution log
     */
    clearExecutionLog() {
        this.executionLog = [];
    }
    /**
     * Update statistics
     */
    updateStats(hookName, results, totalExecutionTime) {
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
        }
        else {
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
    logExecution(hookName, data, results, totalExecutionTime) {
        const logEntry = {
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
    generateHookId() {
        return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.HookSystem = HookSystem;
//# sourceMappingURL=HookSystem.js.map