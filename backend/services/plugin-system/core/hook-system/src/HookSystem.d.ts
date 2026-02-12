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
    priority?: number;
    timeout?: number;
    retries?: number;
    fallback?: boolean;
    filter?: HookFilter;
    metadata?: HookMetadata;
}
export interface HookFilter {
    (context: HookContext): boolean;
}
export interface HookMetadata {
    plugin?: string;
    description?: string;
    tags?: string[];
    version?: string;
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
export declare class HookSystem extends EventEmitter {
    private options;
    private hooks;
    private validators;
    private stats;
    private executionLog;
    private maxLogSize;
    constructor(options?: HookSystemOptions);
    /**
     * Register a hook handler
     */
    registerHook(hookName: string, handler: HookHandler, options?: HookOptions): string;
    /**
     * Unregister a hook
     */
    unregisterHook(hookId: string): boolean;
    /**
     * Register a hook validator
     */
    registerValidator(hookName: string, validator: HookValidator): string;
    /**
     * Execute hooks for a given name and data
     */
    executeHooks(hookName: string, data: any, options?: HookExecutionOptions): Promise<HookResult[]>;
    /**
     * Execute a single hook with retry logic
     */
    private executeSingleHook;
    /**
     * Execute hook handler with timeout
     */
    private executeWithTimeout;
    /**
     * Create hook execution context
     */
    private createHookContext;
    /**
     * Get registered hooks
     */
    getHooks(hookName?: string): HookRegistration[] | Map<string, HookRegistration[]>;
    /**
     * Get hook statistics
     */
    getStats(hookName?: string): HookExecutionStats | Map<string, HookExecutionStats>;
    /**
     * Get execution log
     */
    getExecutionLog(limit?: number): HookExecutionLog[];
    /**
     * Clear statistics
     */
    clearStats(hookName?: string): void;
    /**
     * Clear execution log
     */
    clearExecutionLog(): void;
    /**
     * Update statistics
     */
    private updateStats;
    /**
     * Log execution
     */
    private logExecution;
    /**
     * Generate unique hook ID
     */
    private generateHookId;
    /**
     * Delay utility
     */
    private delay;
}
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
export {};
//# sourceMappingURL=HookSystem.d.ts.map