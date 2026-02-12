import { PluginSDK, PluginManifest, HookHandler, HookOptions } from './PluginSDK';

/**
 * Plugin Builder - Utility class for easily creating plugins
 * Provides a fluent API for plugin development
 */

export interface PluginBuilderConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
}

export interface PluginTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  permissions: string[];
  hooks: string[];
  dependencies?: Record<string, string>;
  configSchema?: Record<string, any>;
}

export class PluginBuilder {
  private config: PluginBuilderConfig;
  private permissions: string[] = [];
  private hooks: Map<string, { handler: HookHandler; options: HookOptions }> = new Map();
  private dependencies: Record<string, string> = {};
  private configSchema: Record<string, any> = {};
  private metadata: Record<string, any> = {};

  constructor(config: PluginBuilderConfig) {
    this.config = config;
  }

  /**
   * Add a permission to the plugin
   */
  addPermission(permission: string): PluginBuilder {
    if (!this.permissions.includes(permission)) {
      this.permissions.push(permission);
    }
    return this;
  }

  /**
   * Add multiple permissions
   */
  addPermissions(permissions: string[]): PluginBuilder {
    permissions.forEach(permission => this.addPermission(permission));
    return this;
  }

  /**
   * Add a hook handler
   */
  addHook(hookName: string, handler: HookHandler, options: HookOptions = {}): PluginBuilder {
    this.hooks.set(hookName, { handler, options });
    return this;
  }

  /**
   * Add a dependency
   */
  addDependency(name: string, version: string): PluginBuilder {
    this.dependencies[name] = version;
    return this;
  }

  /**
   * Add multiple dependencies
   */
  addDependencies(dependencies: Record<string, string>): PluginBuilder {
    Object.assign(this.dependencies, dependencies);
    return this;
  }

  /**
   * Set configuration schema
   */
  setConfigSchema(schema: Record<string, any>): PluginBuilder {
    this.configSchema = schema;
    return this;
  }

  /**
   * Add metadata
   */
  addMetadata(key: string, value: any): PluginBuilder {
    this.metadata[key] = value;
    return this;
  }

  /**
   * Set category
   */
  setCategory(category: string): PluginBuilder {
    return this.addMetadata('category', category);
  }

  /**
   * Add tags
   */
  addTags(tags: string[]): PluginBuilder {
    return this.addMetadata('tags', tags);
  }

  /**
   * Set icon
   */
  setIcon(icon: string): PluginBuilder {
    return this.addMetadata('icon', icon);
  }

  /**
   * Add screenshots
   */
  addScreenshots(screenshots: string[]): PluginBuilder {
    return this.addMetadata('screenshots', screenshots);
  }

  /**
   * Build the plugin manifest
   */
  buildManifest(): PluginManifest {
    const manifest: PluginManifest = {
      id: this.config.id,
      name: this.config.name,
      version: this.config.version,
      permissions: this.permissions,
      hooks: Array.from(this.hooks.keys()),
      dependencies: this.dependencies,
      config: {
        schema: this.configSchema
      },
      metadata: this.metadata
    };

    // Only add optional properties if they exist
    if (this.config.description) {
      manifest.description = this.config.description;
    }
    if (this.config.author) {
      manifest.author = this.config.author;
    }
    if (this.config.license) {
      manifest.license = this.config.license;
    }
    if (this.config.homepage) {
      manifest.homepage = this.config.homepage;
    }
    if (this.config.repository) {
      manifest.repository = this.config.repository;
    }

    return manifest;
  }

  /**
   * Build and initialize the plugin
   */
  async build(): Promise<PluginSDK> {
    // Build manifest for validation (optional, but useful for debugging)
    this.buildManifest();
    const sdk = new PluginSDK({
      pluginId: this.config.id,
      pluginName: this.config.name,
      version: this.config.version,
      permissions: this.permissions,
      hooks: Array.from(this.hooks.keys()),
      sandbox: true,
      debug: false
    });

    await sdk.initialize();

    // Register all hooks
    for (const [hookName, { handler, options }] of this.hooks) {
      sdk.registerHook(hookName, handler, options);
    }

    return sdk;
  }

  /**
   * Create a plugin from a template
   */
  static fromTemplate(template: PluginTemplate, config: Partial<PluginBuilderConfig> = {}): PluginBuilder {
    const builder = new PluginBuilder({
      id: template.id,
      name: template.name,
      version: '1.0.0',
      description: template.description,
      ...config
    });

    builder
      .addPermissions(template.permissions)
      .setCategory(template.category)
      .addDependencies(template.dependencies || {});

    if (template.configSchema) {
      builder.setConfigSchema(template.configSchema);
    }

    return builder;
  }

  /**
   * Create a payment plugin template
   */
  static paymentPlugin(config: PluginBuilderConfig): PluginBuilder {
    return new PluginBuilder(config)
      .addPermissions([
        'payment.process',
        'payment.refund',
        'payment.webhook',
        'customer.read',
        'transaction.write'
      ])
      .setCategory('payment')
      .addTags(['payment', 'gateway', 'stripe', 'paypal'])
      .addMetadata('icon', '💳')
      .addHook('payment:process', async (data, context) => {
        context.logger.info('Processing payment', data);
        return {
          success: true,
          transactionId: `txn_${Date.now()}`,
          status: 'completed'
        };
      })
      .addHook('payment:refund', async (data, context) => {
        context.logger.info('Processing refund', data);
        return {
          success: true,
          refundId: `ref_${Date.now()}`,
          status: 'refunded'
        };
      });
  }

  /**
   * Create an analytics plugin template
   */
  static analyticsPlugin(config: PluginBuilderConfig): PluginBuilder {
    return new PluginBuilder(config)
      .addPermissions([
        'analytics.read',
        'analytics.write',
        'user.tracking',
        'event.tracking',
        'system.info'
      ])
      .setCategory('analytics')
      .addTags(['analytics', 'tracking', 'google', 'metrics'])
      .addMetadata('icon', '📊')
      .addHook('analytics:track', async (data, context) => {
        context.logger.info('Tracking analytics event', data);
        return {
          success: true,
          eventId: `evt_${Date.now()}`,
          tracked: true
        };
      })
      .addHook('analytics:report', async (data, context) => {
        context.logger.info('Generating analytics report', data);
        return {
          success: true,
          reportId: `rpt_${Date.now()}`,
          data: {
            views: 1000,
            clicks: 100,
            conversions: 10
          }
        };
      });
  }

  /**
   * Create an email plugin template
   */
  static emailPlugin(config: PluginBuilderConfig): PluginBuilder {
    return new PluginBuilder(config)
      .addPermissions([
        'email.send',
        'email.template',
        'user.read',
        'audience.manage',
        'campaign.manage'
      ])
      .setCategory('email')
      .addTags(['email', 'marketing', 'mailchimp', 'newsletter'])
      .addMetadata('icon', '📧')
      .addHook('email:send', async (data, context) => {
        context.logger.info('Sending email', data);
        return {
          success: true,
          emailId: `email_${Date.now()}`,
          status: 'sent'
        };
      })
      .addHook('email:template', async (data, context) => {
        context.logger.info('Rendering email template', data);
        return {
          success: true,
          templateId: `tmpl_${Date.now()}`,
          html: '<html><body>Email content</body></html>'
        };
      });
  }
}

/**
 * Plugin development utilities
 */
export class PluginDevUtils {
  /**
   * Validate plugin manifest
   */
  static validateManifest(manifest: PluginManifest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!manifest.id || manifest.id.trim() === '') {
      errors.push('Plugin ID is required');
    }

    if (!manifest.name || manifest.name.trim() === '') {
      errors.push('Plugin name is required');
    }

    if (!manifest.version || manifest.version.trim() === '') {
      errors.push('Plugin version is required');
    }

    if (!manifest.permissions || !Array.isArray(manifest.permissions)) {
      errors.push('Plugin permissions must be an array');
    }

    if (manifest.hooks && !Array.isArray(manifest.hooks)) {
      errors.push('Plugin hooks must be an array');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate plugin template
   */
  static generatePluginTemplate(type: 'payment' | 'analytics' | 'email' | 'custom', config: PluginBuilderConfig): string {
    let builder: PluginBuilder;

    switch (type) {
      case 'payment':
        builder = PluginBuilder.paymentPlugin(config);
        break;
      case 'analytics':
        builder = PluginBuilder.analyticsPlugin(config);
        break;
      case 'email':
        builder = PluginBuilder.emailPlugin(config);
        break;
      default:
        builder = new PluginBuilder(config);
        break;
    }

    const manifest = builder.buildManifest();
    
    return `// Auto-generated plugin template
import { PluginSDK } from '@mnbara/plugin-sdk';

// Plugin configuration
const config = {
  pluginId: '${config.id}',
  pluginName: '${config.name}',
  version: '${config.version}'
};

// Initialize plugin
const plugin = new PluginSDK(config);

// Plugin manifest
export const manifest = ${JSON.stringify(manifest, null, 2)};

// Initialize and export plugin
export async function initialize() {
  await plugin.initialize();
  return plugin;
}

export default plugin;
`;
  }

  /**
   * Get available plugin templates
   */
  static getPluginTemplates(): PluginTemplate[] {
    return [
      {
        id: 'payment-gateway',
        name: 'Payment Gateway Plugin',
        description: 'Process payments through various payment providers',
        category: 'payment',
        permissions: ['payment.process', 'payment.refund', 'customer.read', 'transaction.write'],
        hooks: ['payment:process', 'payment:refund', 'payment:webhook'],
        configSchema: {
          apiKey: { type: 'string', required: true },
          webhookSecret: { type: 'string', required: true },
          currency: { type: 'string', default: 'USD' }
        }
      },
      {
        id: 'analytics-integration',
        name: 'Analytics Integration Plugin',
        description: 'Track user behavior and generate analytics reports',
        category: 'analytics',
        permissions: ['analytics.read', 'analytics.write', 'user.tracking', 'event.tracking'],
        hooks: ['analytics:track', 'analytics:report', 'user:register', 'user:login'],
        configSchema: {
          trackingId: { type: 'string', required: true },
          apiSecret: { type: 'string', required: true },
          debug: { type: 'boolean', default: false }
        }
      },
      {
        id: 'email-marketing',
        name: 'Email Marketing Plugin',
        description: 'Send emails and manage email campaigns',
        category: 'email',
        permissions: ['email.send', 'email.template', 'audience.manage', 'campaign.manage'],
        hooks: ['email:send', 'email:template', 'campaign:create', 'audience:sync'],
        configSchema: {
          apiKey: { type: 'string', required: true },
          fromEmail: { type: 'string', required: true },
          fromName: { type: 'string', required: true }
        }
      },
      {
        id: 'live-streaming',
        name: 'Live Streaming Plugin',
        description: 'Integrate live streaming capabilities',
        category: 'streaming',
        permissions: ['stream.start', 'stream.stop', 'stream.record', 'user.read'],
        hooks: ['stream:start', 'stream:stop', 'stream:record', 'stream:chat'],
        configSchema: {
          streamKey: { type: 'string', required: true },
          rtmpUrl: { type: 'string', required: true },
          maxBitrate: { type: 'number', default: 5000 }
        }
      }
    ];
  }
}