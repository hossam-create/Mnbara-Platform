// ============================================================
// Plugin Sandbox - Secure plugin execution environment
// ============================================================

import { VM } from 'vm2';
import { readFileSync } from 'fs';
import path from 'path';
import { PluginManifest } from '../types/plugin.types';
import { Logger } from '../utils/logger';

export class PluginSandbox {
  private logger: Logger;
  private sandboxConfig: any;

  constructor(logger: Logger) {
    this.logger = logger;
    this.sandboxConfig = {
      timeout: 5000, // 5 second timeout
      sandbox: {
        // Allowed globals
        console: {
          log: (...args: any[]) => this.logger.info(args.join(' ')),
          error: (...args: any[]) => this.logger.error(args.join(' ')),
          warn: (...args: any[]) => this.logger.warn(args.join(' '))
        },
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        setInterval: setInterval,
        clearInterval: clearInterval
      }
    };
  }

  /**
   * Load plugin code in sandbox
   */
  async loadPlugin(entryPath: string, pluginName: string): Promise<any> {
    try {
      // Read plugin code
      const pluginCode = readFileSync(entryPath, 'utf-8');

      // Create VM instance
      const vm = new VM(this.sandboxConfig);

      // Execute plugin code in sandbox
      vm.run(pluginCode);

      // Note: VM2 execution is simplified here
      // In production, you should use dynamic import() or require() in a worker thread
      // For now, we'll use a simple approach with eval (sandboxed)
      
      // Create a context that mimics Node.js module system
      const moduleContext = {
        module: { exports: {} },
        exports: {},
        require: (name: string) => {
          // Only allow certain safe modules
          const allowedModules = ['@mnbara/plugin-sdk'];
          if (!allowedModules.includes(name)) {
            throw new Error(`Module not allowed: ${name}`);
          }
          // Return mock or actual module
          return {};
        }
      };

      // Execute in sandbox with module context
      const vm = new VM({
        ...this.sandboxConfig,
        sandbox: {
          ...this.sandboxConfig.sandbox,
          module: moduleContext.module,
          exports: moduleContext.exports,
          require: moduleContext.require
        }
      });

      vm.run(pluginCode);

      // Get plugin class from module.exports
      const PluginClass = moduleContext.module.exports.default || 
                         moduleContext.module.exports ||
                         moduleContext.exports.default ||
                         moduleContext.exports;

      if (!PluginClass) {
        throw new Error('Plugin class not found in exports');
      }

      if (typeof PluginClass !== 'function') {
        throw new Error('Plugin export must be a class');
      }

      this.logger.info(`Plugin code loaded in sandbox: ${pluginName}`);

      return PluginClass;
    } catch (error: any) {
      this.logger.error(`Failed to load plugin in sandbox: ${pluginName}`, error);
      throw new Error(`Sandbox execution failed: ${error.message}`);
    }
  }

  /**
   * Execute plugin function in sandbox
   */
  async executeInSandbox(code: string, context: Record<string, any> = {}): Promise<any> {
    try {
      const vm = new VM({
        ...this.sandboxConfig,
        sandbox: {
          ...this.sandboxConfig.sandbox,
          ...context
        }
      });

      return vm.run(code);
    } catch (error: any) {
      this.logger.error('Sandbox execution error', error);
      throw error;
    }
  }

  /**
   * Validate plugin code for security
   */
  async validateCode(code: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for dangerous patterns
    const dangerousPatterns = [
      /require\s*\(\s*['"]fs['"]/i,
      /require\s*\(\s*['"]child_process['"]/i,
      /require\s*\(\s*['"]eval['"]/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /process\.exit/i,
      /process\.kill/i,
      /__dirname/i,
      /__filename/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        errors.push(`Dangerous pattern detected: ${pattern.source}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

