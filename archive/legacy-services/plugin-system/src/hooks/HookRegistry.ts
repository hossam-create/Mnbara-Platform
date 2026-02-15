// ============================================================
// Hook Registry - Manages plugin hooks
// ============================================================

import { PrismaClient } from '@prisma/client';
import { HookRegistry as IHookRegistry, HookDefinition } from '../types/plugin.types';
import { Logger } from '../utils/logger';

export class HookRegistry implements IHookRegistry {
  private prisma: PrismaClient;
  private logger: Logger;
  private hooks: Map<string, HookDefinition[]> = new Map();

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Register a hook
   */
  async register(
    pluginId: string,
    hookName: string,
    handler: Function,
    priority: number = 100
  ): Promise<void> {
    try {
      // Store in memory
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }

      const hookDef: HookDefinition = {
        name: hookName,
        handler,
        priority,
        pluginId
      };

      const hooks = this.hooks.get(hookName)!;
      hooks.push(hookDef);

      // Sort by priority (lower = higher priority)
      hooks.sort((a, b) => a.priority - b.priority);

      // Store in database
      await this.prisma.pluginHook.upsert({
        where: {
          pluginId_hookName: {
            pluginId,
            hookName
          }
        },
        create: {
          pluginId,
          hookName,
          handlerFunction: handler.name || 'anonymous',
          priority,
          enabled: true
        },
        update: {
          handlerFunction: handler.name || 'anonymous',
          priority,
          enabled: true
        }
      });

      this.logger.info(`Hook registered: ${hookName} by plugin ${pluginId}`, {
        priority
      });
    } catch (error: any) {
      this.logger.error(`Failed to register hook: ${hookName}`, error);
      throw error;
    }
  }

  /**
   * Unregister a hook
   */
  async unregister(pluginId: string, hookName: string, handler?: Function): Promise<void> {
    try {
      // Remove from memory
      const hooks = this.hooks.get(hookName);
      if (hooks) {
        const filtered = hooks.filter(
          h => h.pluginId !== pluginId && (!handler || h.handler !== handler)
        );
        this.hooks.set(hookName, filtered);
      }

      // Remove from database
      await this.prisma.pluginHook.deleteMany({
        where: {
          pluginId,
          hookName
        }
      });

      this.logger.info(`Hook unregistered: ${hookName} by plugin ${pluginId}`);
    } catch (error: any) {
      this.logger.error(`Failed to unregister hook: ${hookName}`, error);
      throw error;
    }
  }

  /**
   * Unregister all hooks for a plugin
   */
  async unregisterAll(pluginId: string): Promise<void> {
    try {
      // Remove from memory
      for (const [hookName, hooks] of this.hooks.entries()) {
        const filtered = hooks.filter(h => h.pluginId !== pluginId);
        if (filtered.length === 0) {
          this.hooks.delete(hookName);
        } else {
          this.hooks.set(hookName, filtered);
        }
      }

      // Remove from database
      await this.prisma.pluginHook.deleteMany({
        where: { pluginId }
      });

      this.logger.info(`All hooks unregistered for plugin: ${pluginId}`);
    } catch (error: any) {
      this.logger.error(`Failed to unregister all hooks for plugin: ${pluginId}`, error);
      throw error;
    }
  }

  /**
   * Execute a hook
   */
  async execute(hookName: string, data: any): Promise<any> {
    const hooks = this.hooks.get(hookName);

    if (!hooks || hooks.length === 0) {
      this.logger.debug(`No hooks registered for: ${hookName}`);
      return data; // Return data unchanged if no hooks
    }

    this.logger.debug(`Executing hook: ${hookName} with ${hooks.length} handlers`);

    let result = data;

    // Execute hooks in priority order
    for (const hook of hooks) {
      try {
        // Check if hook is enabled in database
        const dbHook = await this.prisma.pluginHook.findUnique({
          where: {
            pluginId_hookName: {
              pluginId: hook.pluginId,
              hookName: hook.name
            }
          }
        });

        if (dbHook && !dbHook.enabled) {
          this.logger.debug(`Hook disabled: ${hookName} by plugin ${hook.pluginId}`);
          continue;
        }

        // Execute handler
        const hookResult = await hook.handler(result);

        // If handler returns a value, use it for next hook
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error: any) {
        this.logger.error(`Hook execution error: ${hookName} by plugin ${hook.pluginId}`, error);
        // Continue with next hook even if one fails
      }
    }

    return result;
  }

  /**
   * Check if hook has handlers
   */
  has(hookName: string): boolean {
    const hooks = this.hooks.get(hookName);
    return hooks !== undefined && hooks.length > 0;
  }

  /**
   * Get all hooks for a plugin
   */
  async getPluginHooks(pluginId: string): Promise<HookDefinition[]> {
    const allHooks: HookDefinition[] = [];

    for (const hooks of this.hooks.values()) {
      const pluginHooks = hooks.filter(h => h.pluginId === pluginId);
      allHooks.push(...pluginHooks);
    }

    return allHooks;
  }

  /**
   * Load hooks from database (on startup)
   */
  async loadHooksFromDatabase(): Promise<void> {
    try {
      const dbHooks = await this.prisma.pluginHook.findMany({
        where: { enabled: true },
        include: { plugin: true }
      });

      this.logger.info(`Loading ${dbHooks.length} hooks from database`);

      // Note: Handlers need to be loaded from plugins
      // This is just metadata loading
      for (const dbHook of dbHooks) {
        if (!this.hooks.has(dbHook.hookName)) {
          this.hooks.set(dbHook.hookName, []);
        }

        // Handler will be registered when plugin is loaded
        this.logger.debug(`Hook metadata loaded: ${dbHook.hookName} by plugin ${dbHook.pluginId}`);
      }
    } catch (error: any) {
      this.logger.error('Failed to load hooks from database', error);
      throw error;
    }
  }
}

