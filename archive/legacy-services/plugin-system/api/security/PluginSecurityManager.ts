import crypto from 'crypto';
import { PluginManifest, PluginPermission } from '../types';

/**
 * Plugin Security Manager
 * Handles plugin permission validation, sandboxing, and security policies
 */
export class PluginSecurityManager {
  private allowedPermissions: Set<string>;
  private blockedModules: Set<string>;
  private permissionGrants: Map<string, Set<string>>;

  constructor() {
    this.allowedPermissions = new Set([
      'read:config',
      'write:config',
      'read:data',
      'write:data',
      'network:http',
      'network:websocket',
      'ui:render',
      'ui:modal',
      'hook:register',
      'hook:execute',
      'marketplace:read',
      'marketplace:install',
    ]);

    this.blockedModules = new Set([
      'child_process',
      'cluster',
      'dgram',
      'fs',
      'net',
      'tls',
      'dns',
      'http2',
      'https',
      'http',
      'os',
      'path',
      'querystring',
      'readline',
      'repl',
      'stream',
      'string_decoder',
      'timers',
      'tty',
      'url',
      'util',
      'v8',
      'vm',
      'zlib',
    ]);

    this.permissionGrants = new Map();
  }

  /**
   * Validate plugin manifest and permissions
   */
  validatePluginManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!manifest.name) {
      errors.push('Plugin name is required');
    }

    if (!manifest.version) {
      errors.push('Plugin version is required');
    }

    if (!manifest.main) {
      errors.push('Plugin main entry point is required');
    }

    // Validate permissions
    if (manifest.permissions) {
      for (const permission of manifest.permissions) {
        if (!this.isPermissionAllowed(permission)) {
          errors.push(`Permission '${permission}' is not allowed`);
        }
      }
    }

    // Validate dependencies
    if (manifest.dependencies) {
      for (const dep of Object.keys(manifest.dependencies)) {
        if (this.isModuleBlocked(dep)) {
          errors.push(`Dependency '${dep}' is blocked for security reasons`);
        }
      }
    }

    // Validate author
    if (manifest.author && !this.isValidAuthor(manifest.author)) {
      errors.push('Invalid author format');
    }

    // Validate repository
    if (manifest.repository && !this.isValidRepository(manifest.repository)) {
      errors.push('Invalid repository URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create security sandbox for plugin execution
   */
  createSandbox(pluginName: string, permissions: string[]): any {
    const allowedModules = this.getAllowedModules(permissions);
    
    return {
      // Allowed globals
      console: this.createSecureConsole(pluginName),
      setTimeout: this.createSecureTimeout(pluginName),
      setInterval: this.createSecureInterval(pluginName),
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      
      // Allowed modules (whitelist approach)
      require: this.createSecureRequire(pluginName, allowedModules),
      
      // Security policies
      process: this.createSecureProcess(pluginName, permissions),
      Buffer: this.createSecureBuffer(pluginName),
      
      // Plugin-specific APIs
      plugin: {
        name: pluginName,
        log: this.createPluginLogger(pluginName),
        config: this.createConfigAPI(pluginName, permissions),
        data: this.createDataAPI(pluginName, permissions),
        network: this.createNetworkAPI(pluginName, permissions),
        ui: this.createUIAPI(pluginName, permissions),
        hooks: this.createHooksAPI(pluginName, permissions),
      },
    };
  }

  /**
   * Check if permission is allowed
   */
  isPermissionAllowed(permission: string): boolean {
    return this.allowedPermissions.has(permission);
  }

  /**
   * Check if module is blocked
   */
  isModuleBlocked(module: string): boolean {
    return this.blockedModules.has(module);
  }

  /**
   * Grant permission to plugin
   */
  grantPermission(pluginName: string, permission: string): void {
    if (!this.permissionGrants.has(pluginName)) {
      this.permissionGrants.set(pluginName, new Set());
    }
    this.permissionGrants.get(pluginName)!.add(permission);
  }

  /**
   * Revoke permission from plugin
   */
  revokePermission(pluginName: string, permission: string): void {
    if (this.permissionGrants.has(pluginName)) {
      this.permissionGrants.get(pluginName)!.delete(permission);
    }
  }

  /**
   * Check if plugin has permission
   */
  hasPermission(pluginName: string, permission: string): boolean {
    const grants = this.permissionGrants.get(pluginName);
    return grants ? grants.has(permission) : false;
  }

  /**
   * Generate secure plugin ID
   */
  generatePluginId(pluginName: string): string {
    return crypto.createHash('sha256').update(`${pluginName}-${Date.now()}`).digest('hex');
  }

  /**
   * Validate plugin signature
   */
  validateSignature(pluginData: Buffer, signature: string, publicKey: string): boolean {
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(pluginData);
      return verifier.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  /**
   * Create secure console for plugin
   */
  private createSecureConsole(pluginName: string): any {
    return {
      log: (...args: any[]) => console.log(`[${pluginName}]`, ...args),
      error: (...args: any[]) => console.error(`[${pluginName}]`, ...args),
      warn: (...args: any[]) => console.warn(`[${pluginName}]`, ...args),
      info: (...args: any[]) => console.info(`[${pluginName}]`, ...args),
    };
  }

  /**
   * Create secure timeout function
   */
  private createSecureTimeout(pluginName: string): any {
    return (callback: Function, delay: number, ...args: any[]) => {
      // Limit timeout to prevent hanging
      const maxDelay = 30000; // 30 seconds
      const safeDelay = Math.min(delay, maxDelay);
      
      return setTimeout(() => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[${pluginName}] Timeout callback error:`, error);
        }
      }, safeDelay);
    };
  }

  /**
   * Create secure interval function
   */
  private createSecureInterval(pluginName: string): any {
    return (callback: Function, delay: number, ...args: any[]) => {
      // Limit interval to prevent resource exhaustion
      const minDelay = 1000; // 1 second minimum
      const safeDelay = Math.max(delay, minDelay);
      
      return setInterval(() => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`[${pluginName}] Interval callback error:`, error);
        }
      }, safeDelay);
    };
  }

  /**
   * Create secure require function
   */
  private createSecureRequire(pluginName: string, allowedModules: string[]): any {
    return (moduleName: string) => {
      if (!allowedModules.includes(moduleName)) {
        throw new Error(`Module '${moduleName}' is not allowed for plugin '${pluginName}'`);
      }
      
      // Return mock implementations for allowed modules
      return this.createModuleMock(moduleName);
    };
  }

  /**
   * Create secure process object
   */
  private createSecureProcess(pluginName: string, permissions: string[]): any {
    return {
      env: this.createSecureEnv(pluginName, permissions),
      version: process.version,
      platform: process.platform,
      // Block dangerous methods
      exit: () => {
        throw new Error('Plugin cannot exit the process');
      },
      kill: () => {
        throw new Error('Plugin cannot kill processes');
      },
    };
  }

  /**
   * Create secure environment variables
   */
  private createSecureEnv(pluginName: string, permissions: string[]): any {
    const allowedEnvVars = [
      'NODE_ENV',
      'PLUGIN_API_URL',
      'PLUGIN_WS_URL',
    ];
    
    const secureEnv: any = {};
    for (const key of allowedEnvVars) {
      if (process.env[key]) {
        secureEnv[key] = process.env[key];
      }
    }
    
    // Add plugin-specific environment variables
    secureEnv.PLUGIN_NAME = pluginName;
    secureEnv.PLUGIN_PERMISSIONS = permissions.join(',');
    
    return secureEnv;
  }

  /**
   * Create secure Buffer
   */
  private createSecureBuffer(pluginName: string): any {
    return {
      from: (data: any, encoding?: any) => {
        // Limit buffer size to prevent memory exhaustion
        const maxSize = 1024 * 1024; // 1MB
        if (data.length > maxSize) {
          throw new Error('Buffer size exceeds maximum allowed size');
        }
        return Buffer.from(data, encoding);
      },
    };
  }

  /**
   * Create plugin logger
   */
  private createPluginLogger(pluginName: string): any {
    return {
      log: (level: string, message: string, meta?: any) => {
        console.log(`[${pluginName}] [${level}] ${message}`, meta ? JSON.stringify(meta) : '');
      },
      info: (message: string, meta?: any) => this.createPluginLogger(pluginName).log('INFO', message, meta),
      warn: (message: string, meta?: any) => this.createPluginLogger(pluginName).log('WARN', message, meta),
      error: (message: string, meta?: any) => this.createPluginLogger(pluginName).log('ERROR', message, meta),
      debug: (message: string, meta?: any) => this.createPluginLogger(pluginName).log('DEBUG', message, meta),
    };
  }

  /**
   * Create config API
   */
  private createConfigAPI(pluginName: string, permissions: string[]): any {
    if (!permissions.includes('read:config') && !permissions.includes('write:config')) {
      return {};
    }
    
    return {
      get: (key: string) => {
        // Implement secure config retrieval
        return process.env[`PLUGIN_${pluginName}_${key}`];
      },
      set: (key: string, value: any) => {
        if (!permissions.includes('write:config')) {
          throw new Error('Plugin does not have write:config permission');
        }
        // Implement secure config setting
        process.env[`PLUGIN_${pluginName}_${key}`] = JSON.stringify(value);
      },
    };
  }

  /**
   * Create data API
   */
  private createDataAPI(pluginName: string, permissions: string[]): any {
    if (!permissions.includes('read:data') && !permissions.includes('write:data')) {
      return {};
    }
    
    return {
      get: (key: string) => {
        if (!permissions.includes('read:data')) {
          throw new Error('Plugin does not have read:data permission');
        }
        // Implement secure data retrieval
        return null; // Placeholder
      },
      set: (key: string, value: any) => {
        if (!permissions.includes('write:data')) {
          throw new Error('Plugin does not have write:data permission');
        }
        // Implement secure data setting
        return null; // Placeholder
      },
    };
  }

  /**
   * Create network API
   */
  private createNetworkAPI(pluginName: string, permissions: string[]): any {
    if (!permissions.includes('network:http') && !permissions.includes('network:websocket')) {
      return {};
    }
    
    return {
      fetch: (url: string, options?: any) => {
        if (!permissions.includes('network:http')) {
          throw new Error('Plugin does not have network:http permission');
        }
        // Implement secure HTTP requests
        return fetch(url, options);
      },
      websocket: (url: string) => {
        if (!permissions.includes('network:websocket')) {
          throw new Error('Plugin does not have network:websocket permission');
        }
        // Implement secure WebSocket connections
        return new WebSocket(url);
      },
    };
  }

  /**
   * Create UI API
   */
  private createUIAPI(pluginName: string, permissions: string[]): any {
    if (!permissions.includes('ui:render') && !permissions.includes('ui:modal')) {
      return {};
    }
    
    return {
      render: (component: any, target?: string) => {
        if (!permissions.includes('ui:render')) {
          throw new Error('Plugin does not have ui:render permission');
        }
        // Implement secure UI rendering
        return null; // Placeholder
      },
      modal: (options: any) => {
        if (!permissions.includes('ui:modal')) {
          throw new Error('Plugin does not have ui:modal permission');
        }
        // Implement secure modal creation
        return null; // Placeholder
      },
    };
  }

  /**
   * Create hooks API
   */
  private createHooksAPI(pluginName: string, permissions: string[]): any {
    if (!permissions.includes('hook:register') && !permissions.includes('hook:execute')) {
      return {};
    }
    
    return {
      register: (hookName: string, handler: Function) => {
        if (!permissions.includes('hook:register')) {
          throw new Error('Plugin does not have hook:register permission');
        }
        // Implement secure hook registration
        return null; // Placeholder
      },
      trigger: (hookName: string, data?: any) => {
        if (!permissions.includes('hook:execute')) {
          throw new Error('Plugin does not have hook:execute permission');
        }
        // Implement secure hook triggering
        return null; // Placeholder
      },
    };
  }

  /**
   * Get allowed modules based on permissions
   */
  private getAllowedModules(permissions: string[]): string[] {
    const allowed: string[] = [];
    
    // Always allow basic modules
    allowed.push('events', 'util');
    
    // Add permission-based modules
    if (permissions.includes('network:http')) {
      allowed.push('node-fetch');
    }
    
    return allowed;
  }

  /**
   * Create module mock
   */
  private createModuleMock(moduleName: string): any {
    // Return safe mock implementations
    switch (moduleName) {
      case 'events':
        return require('events');
      case 'util':
        return require('util');
      case 'node-fetch':
        return require('node-fetch');
      default:
        return {};
    }
  }

  /**
   * Validate author format
   */
  private isValidAuthor(author: string): boolean {
    // Simple validation - can be enhanced
    return author.length > 0 && author.length < 100;
  }

  /**
   * Validate repository URL
   */
  private isValidRepository(repository: string): boolean {
    // Simple URL validation - can be enhanced
    try {
      new URL(repository);
      return true;
    } catch {
      return false;
    }
  }
}