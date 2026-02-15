/**
 * Plugin Security
 * 
 * Security utilities for MNBara plugins
 */

import { PluginPermissions } from '../types/plugin-types';

export interface SecurityPolicy {
  allow: string[];
  deny: string[];
  conditions?: {
    [key: string]: (context: any) => boolean;
  };
}

export interface PermissionChecker {
  hasPermission: (permission: string) => boolean;
  hasPermissions: (permissions: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  checkPermission: (permission: string, context?: any) => boolean;
  getPermissions: () => string[];
  addPermission: (permission: string) => void;
  removePermission: (permission: string) => void;
}

export interface PluginSecurity {
  validatePermissions: (requested: PluginPermissions, granted: PluginPermissions) => boolean;
  checkPermission: (permission: string, permissions: PluginPermissions, context?: any) => boolean;
  sanitizeInput: (input: any, options?: SanitizationOptions) => any;
  validateInput: (input: any, schema?: any) => boolean;
  createPermissionChecker: (permissions: PluginPermissions) => PermissionChecker;
  addPolicy: (name: string, policy: SecurityPolicy) => void;
  removePolicy: (name: string) => void;
  getPolicy: (name: string) => SecurityPolicy | undefined;
  evaluatePolicy: (name: string, context: any) => boolean;
}

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  allowedProtocols?: string[];
  stripUnknown?: boolean;
  escapeHtml?: boolean;
  maxLength?: number;
  allowedValues?: any[];
}

export class DefaultPluginSecurity implements PluginSecurity {
  private policies: Record<string, SecurityPolicy> = {};

  constructor() {
    this.initializeDefaultPolicies();
  }

  validatePermissions(requested: PluginPermissions, granted: PluginPermissions): boolean {
    // Check wallet permissions
    if (requested.wallet && granted.wallet) {
      for (const [permission, value] of Object.entries(requested.wallet)) {
        if (value && !granted.wallet[permission as keyof typeof granted.wallet]) {
          return false;
        }
      }
    }

    // Check API permissions
    if (requested.api && granted.api) {
      for (const [permission, value] of Object.entries(requested.api)) {
        if (value && !granted.api[permission as keyof typeof granted.api]) {
          return false;
        }
      }
    }

    // Check UI permissions
    if (requested.ui && granted.ui) {
      for (const [permission, value] of Object.entries(requested.ui)) {
        if (value && !granted.ui[permission as keyof typeof granted.ui]) {
          return false;
        }
      }
    }

    // Check hooks permissions
    if (requested.hooks && granted.hooks) {
      for (const [permission, value] of Object.entries(requested.hooks)) {
        if (value && !granted.hooks[permission as keyof typeof granted.hooks]) {
          return false;
        }
      }
    }

    // Check storage permissions
    if (requested.storage && granted.storage) {
      for (const [permission, value] of Object.entries(requested.storage)) {
        if (value && !granted.storage[permission as keyof typeof granted.storage]) {
          return false;
        }
      }
    }

    // Check system permissions
    if (requested.system && granted.system) {
      for (const [permission, value] of Object.entries(requested.system)) {
        if (value && !granted.system[permission as keyof typeof granted.system]) {
          return false;
        }
      }
    }

    return true;
  }

  checkPermission(permission: string, permissions: PluginPermissions, context?: any): boolean {
    const [category, action] = permission.split('.');
    
    if (!category || !action) {
      return false;
    }

    const categoryPermissions = permissions[category as keyof PluginPermissions] as any;
    if (!categoryPermissions) {
      return false;
    }

    const hasPermission = categoryPermissions[action] === true;
    if (!hasPermission) {
      return false;
    }

    // Check additional conditions if provided
    if (context && this.policies[permission]) {
      const policy = this.policies[permission];
      if (policy.conditions) {
        for (const [conditionName, conditionFn] of Object.entries(policy.conditions)) {
          if (!conditionFn(context)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  sanitizeInput(input: any, options?: SanitizationOptions): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input, options);
    } else if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item, options));
    } else if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value, options);
      }
      return sanitized;
    }
    return input;
  }

  validateInput(input: any, schema?: any): boolean {
    if (!schema) {
      return true;
    }

    // Simple validation - in a real implementation, you'd use a proper validation library
    if (schema.type) {
      switch (schema.type) {
        case 'string':
          return typeof input === 'string';
        case 'number':
          return typeof input === 'number' && !isNaN(input);
        case 'boolean':
          return typeof input === 'boolean';
        case 'array':
          return Array.isArray(input);
        case 'object':
          return typeof input === 'object' && input !== null && !Array.isArray(input);
        default:
          return true;
      }
    }

    return true;
  }

  createPermissionChecker(permissions: PluginPermissions): PermissionChecker {
    return new DefaultPermissionChecker(permissions, this);
  }

  addPolicy(name: string, policy: SecurityPolicy): void {
    this.policies[name] = policy;
  }

  removePolicy(name: string): void {
    delete this.policies[name];
  }

  getPolicy(name: string): SecurityPolicy | undefined {
    return this.policies[name];
  }

  evaluatePolicy(name: string, context: any): boolean {
    const policy = this.policies[name];
    if (!policy) {
      return true;
    }

    // Check deny list first
    if (policy.deny && policy.deny.length > 0) {
      for (const denied of policy.deny) {
        if (this.matchesPattern(context, denied)) {
          return false;
        }
      }
    }

    // Check allow list
    if (policy.allow && policy.allow.length > 0) {
      for (const allowed of policy.allow) {
        if (this.matchesPattern(context, allowed)) {
          return true;
        }
      }
      return false; // If allow list exists and no match, deny
    }

    // Check conditions
    if (policy.conditions) {
      for (const [conditionName, conditionFn] of Object.entries(policy.conditions)) {
        if (!conditionFn(context)) {
          return false;
        }
      }
    }

    return true;
  }

  private sanitizeString(input: string, options?: SanitizationOptions): string {
    let sanitized = input;

    // Max length check
    if (options?.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Allowed values check
    if (options?.allowedValues && !options.allowedValues.includes(sanitized)) {
      throw new Error(`Invalid value: ${sanitized}`);
    }

    // HTML escaping
    if (options?.escapeHtml) {
      sanitized = sanitized
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }

    return sanitized;
  }

  private matchesPattern(context: any, pattern: string): boolean {
    // Simple pattern matching - in a real implementation, you'd use a proper pattern matching library
    if (typeof context === 'string') {
      return context.includes(pattern) || new RegExp(pattern).test(context);
    }
    return false;
  }

  private initializeDefaultPolicies(): void {
    // Add default security policies here
    this.addPolicy('system.network', {
      allow: ['localhost', '127.0.0.1'],
      deny: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
      conditions: {
        'rate-limit': (context) => {
          // Simple rate limiting logic
          return true; // For now, always allow
        }
      }
    });
  }
}

class DefaultPermissionChecker implements PermissionChecker {
  constructor(
    private permissions: PluginPermissions,
    private security: PluginSecurity
  ) {}

  hasPermission(permission: string): boolean {
    return this.security.checkPermission(permission, this.permissions);
  }

  hasPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  checkPermission(permission: string, context?: any): boolean {
    return this.security.checkPermission(permission, this.permissions, context);
  }

  getPermissions(): string[] {
    const permissions: string[] = [];
    
    for (const [category, categoryPermissions] of Object.entries(this.permissions)) {
      for (const [action, allowed] of Object.entries(categoryPermissions as any)) {
        if (allowed) {
          permissions.push(`${category}.${action}`);
        }
      }
    }
    
    return permissions;
  }

  addPermission(permission: string): void {
    const [category, action] = permission.split('.');
    if (category && action) {
      const categoryPermissions = this.permissions[category as keyof PluginPermissions] as any;
      if (categoryPermissions) {
        categoryPermissions[action] = true;
      }
    }
  }

  removePermission(permission: string): void {
    const [category, action] = permission.split('.');
    if (category && action) {
      const categoryPermissions = this.permissions[category as keyof PluginPermissions] as any;
      if (categoryPermissions) {
        categoryPermissions[action] = false;
      }
    }
  }
}