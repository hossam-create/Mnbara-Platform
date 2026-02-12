/**
 * Plugin Template Generator
 * 
 * Generates complete plugin templates with best practices, TypeScript support,
 * and all necessary files for a production-ready plugin.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface PluginTemplateOptions {
  pluginName: string;
  pluginId: string;
  description: string;
  author: string;
  version: string;
  type: 'basic' | 'wallet-integration' | 'hook-provider' | 'ui-component' | 'api-service';
  features: {
    typescript: boolean;
    hooks: boolean;
    walletIntegration: boolean;
    uiComponents: boolean;
    apiEndpoints: boolean;
    configuration: boolean;
    permissions: string[];
  };
  outputDirectory: string;
}

export class PluginTemplateGenerator {
  private options: PluginTemplateOptions;

  constructor(options: PluginTemplateOptions) {
    this.options = options;
  }

  async generate(): Promise<void> {
    const { outputDirectory, pluginName } = this.options;
    
    // Create plugin directory
    const pluginDir = path.join(outputDirectory, pluginName);
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    // Generate all template files
    await this.generatePackageJson(pluginDir);
    await this.generateManifest(pluginDir);
    await this.generateMainFile(pluginDir);
    await this.generateConfiguration(pluginDir);
    await this.generateTypes(pluginDir);
    await this.generateHooks(pluginDir);
    await this.generateWalletIntegration(pluginDir);
    await this.generateUIComponents(pluginDir);
    await this.generateAPIEndpoints(pluginDir);
    await this.generateTests(pluginDir);
    await this.generateDocumentation(pluginDir);
    await this.generateBuildConfig(pluginDir);
    await this.generateGitignore(pluginDir);
    await this.generateESLintConfig(pluginDir);
    await this.generatePrettierConfig(pluginDir);

    console.log(`✅ Plugin template generated successfully at: ${pluginDir}`);
  }

  private async generatePackageJson(pluginDir: string): Promise<void> {
    const { pluginName, description, author, version, features } = this.options;
    
    const packageJson = {
      name: `@mnbara/${pluginName}`,
      version,
      description,
      author,
      main: features.typescript ? 'dist/index.js' : 'index.js',
      types: features.typescript ? 'dist/index.d.ts' : undefined,
      scripts: {
        build: features.typescript ? 'tsc' : 'echo "No build needed"',
        dev: features.typescript ? 'tsc --watch' : 'echo "No dev mode"',
        test: 'jest',
        lint: 'eslint src/**/*.ts',
        'lint:fix': 'eslint src/**/*.ts --fix',
        format: 'prettier --write "src/**/*.{ts,js,json,md}"',
        'plugin:validate': 'mnbara-plugin validate',
        'plugin:package': 'mnbara-plugin package',
        prebuild: 'npm run lint',
        prepublishOnly: 'npm run build && npm run test'
      },
      dependencies: {
        '@mnbara/plugin-sdk': '^1.0.0',
        'zod': '^3.22.0'
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@types/jest': '^29.0.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        'eslint': '^8.0.0',
        'jest': '^29.0.0',
        'prettier': '^3.0.0',
        'ts-jest': '^29.0.0',
        'typescript': '^5.0.0'
      },
      peerDependencies: {
        '@mnbara/plugin-system': '^1.0.0'
      },
      keywords: ['mnbara', 'plugin', 'wallet', 'integration'],
      license: 'MIT',
      repository: {
        type: 'git',
        url: `git+https://github.com/mnbara/${pluginName}.git`
      },
      bugs: {
        url: `https://github.com/mnbara/${pluginName}/issues`
      },
      homepage: `https://github.com/mnbara/${pluginName}#readme`
    };

    if (!features.typescript) {
      delete packageJson.types;
      delete packageJson.devDependencies['@typescript-eslint/eslint-plugin'];
      delete packageJson.devDependencies['@typescript-eslint/parser'];
      delete packageJson.devDependencies['ts-jest'];
      delete packageJson.devDependencies['typescript'];
    }

    fs.writeFileSync(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private async generateManifest(pluginDir: string): Promise<void> {
    const { pluginId, pluginName, description, author, version, features } = this.options;
    
    const manifest = {
      id: pluginId,
      name: pluginName,
      version,
      description,
      author,
      main: features.typescript ? 'dist/index.js' : 'index.js',
      entry: features.typescript ? 'src/index.ts' : 'index.js',
      enabled: true,
      permissions: features.permissions || [],
      dependencies: {},
      hooks: features.hooks ? [
        'wallet:transaction:created',
        'wallet:transaction:completed',
        'plugin:activated',
        'plugin:deactivated'
      ] : [],
      configuration: features.configuration ? {
        schema: {
          type: 'object',
          properties: {
            apiKey: { type: 'string', description: 'API key for external service' },
            webhookUrl: { type: 'string', description: 'Webhook URL for notifications' },
            enabled: { type: 'boolean', default: true, description: 'Enable/disable plugin' },
            debug: { type: 'boolean', default: false, description: 'Enable debug logging' }
          },
          required: ['apiKey']
        },
        defaults: {
          enabled: true,
          debug: false
        }
      } : undefined,
      walletIntegration: features.walletIntegration ? {
        supportedChains: ['ethereum', 'polygon', 'bsc', 'arbitrum'],
        transactionTypes: ['transfer', 'swap', 'stake'],
        features: ['balance-tracking', 'transaction-monitoring', 'fee-estimation']
      } : undefined,
      ui: features.uiComponents ? {
        components: [
          {
            name: 'PluginDashboard',
            type: 'dashboard-widget',
            route: '/plugins/${pluginName}/dashboard'
          },
          {
            name: 'PluginSettings',
            type: 'settings-panel',
            route: '/plugins/${pluginName}/settings'
          }
        ]
      } : undefined,
      api: features.apiEndpoints ? {
        endpoints: [
          {
            method: 'GET',
            path: '/plugins/${pluginName}/status',
            description: 'Get plugin status and health'
          },
          {
            method: 'POST',
            path: '/plugins/${pluginName}/configure',
            description: 'Update plugin configuration'
          }
        ]
      } : undefined
    };

    fs.writeFileSync(
      path.join(pluginDir, 'plugin-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  private async generateMainFile(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    const fileExtension = features.typescript ? 'ts' : 'js';
    const mainFile = features.typescript ? 'src/index.ts' : 'index.js';
    
    let content = '';

    if (features.typescript) {
      content += `import { PluginSDK, PluginContext, PluginConfig, HookContext, WalletContext } from '@mnbara/plugin-sdk';
import { z } from 'zod';

// Plugin configuration schema
const configSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  webhookUrl: z.string().url().optional(),
  enabled: z.boolean().default(true),
  debug: z.boolean().default(false)
});

type PluginConfig = z.infer<typeof configSchema>;

// Plugin class
export class ${this.toPascalCase(pluginName)}Plugin {
  private sdk: PluginSDK;
  private config: PluginConfig;
  private context: PluginContext;
  private logger: any;

  constructor(context: PluginContext) {
    this.context = context;
    this.sdk = context.sdk;
    this.logger = context.logger;
    this.config = configSchema.parse(context.config || {});
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing ${pluginName} plugin');
    
    // Validate configuration
    if (!this.config.enabled) {
      this.logger.warn('Plugin is disabled in configuration');
      return;
    }

    // Register hooks
    await this.registerHooks();
    
    // Initialize wallet integration if enabled
    ${features.walletIntegration ? 'await this.initializeWalletIntegration();' : ''}
    
    // Initialize UI components if enabled
    ${features.uiComponents ? 'await this.initializeUIComponents();' : ''}
    
    // Initialize API endpoints if enabled
    ${features.apiEndpoints ? 'await this.initializeAPIEndpoints();' : ''}
    
    this.logger.info('${pluginName} plugin initialized successfully');
  }

  async destroy(): Promise<void> {
    this.logger.info('Destroying ${pluginName} plugin');
    
    // Cleanup resources
    ${features.walletIntegration ? 'await this.cleanupWalletIntegration();' : ''}
    ${features.uiComponents ? 'await this.cleanupUIComponents();' : ''}
    ${features.apiEndpoints ? 'await this.cleanupAPIEndpoints();' : ''}
    
    this.logger.info('${pluginName} plugin destroyed successfully');
  }

  private async registerHooks(): Promise<void> {
${features.hooks ? `
    // Register transaction hooks
    this.sdk.hooks.register('wallet:transaction:created', this.onTransactionCreated.bind(this));
    this.sdk.hooks.register('wallet:transaction:completed', this.onTransactionCompleted.bind(this));
    
    // Register plugin lifecycle hooks
    this.sdk.hooks.register('plugin:activated', this.onPluginActivated.bind(this));
    this.sdk.hooks.register('plugin:deactivated', this.onPluginDeactivated.bind(this));
` : ''}
  }

${features.hooks ? `
  private async onTransactionCreated(context: HookContext): Promise<void> {
    if (this.config.debug) {
      this.logger.debug('Transaction created:', context.data);
    }
    
    // Add your transaction created logic here
  }

  private async onTransactionCompleted(context: HookContext): Promise<void> {
    if (this.config.debug) {
      this.logger.debug('Transaction completed:', context.data);
    }
    
    // Add your transaction completed logic here
  }

  private async onPluginActivated(context: HookContext): Promise<void> {
    this.logger.info('Plugin activated:', context.data);
  }

  private async onPluginDeactivated(context: HookContext): Promise<void> {
    this.logger.info('Plugin deactivated:', context.data);
  }
` : ''}

${features.walletIntegration ? `
  private async initializeWalletIntegration(): Promise<void> {
    this.logger.info('Initializing wallet integration');
    
    // Register wallet event listeners
    this.sdk.wallet.on('transaction:submitted', this.onWalletTransactionSubmitted.bind(this));
    this.sdk.wallet.on('transaction:confirmed', this.onWalletTransactionConfirmed.bind(this));
    this.sdk.wallet.on('balance:changed', this.onWalletBalanceChanged.bind(this));
  }

  private async cleanupWalletIntegration(): Promise<void> {
    this.sdk.wallet.off('transaction:submitted', this.onWalletTransactionSubmitted.bind(this));
    this.sdk.wallet.off('transaction:confirmed', this.onWalletTransactionConfirmed.bind(this));
    this.sdk.wallet.off('balance:changed', this.onWalletBalanceChanged.bind(this));
  }

  private async onWalletTransactionSubmitted(context: WalletContext): Promise<void> {
    this.logger.info('Wallet transaction submitted:', context.transactionId);
  }

  private async onWalletTransactionConfirmed(context: WalletContext): Promise<void> {
    this.logger.info('Wallet transaction confirmed:', context.transactionId);
  }

  private async onWalletBalanceChanged(context: WalletContext): Promise<void> {
    if (this.config.debug) {
      this.logger.debug('Wallet balance changed:', context.address);
    }
  }
` : ''}

${features.uiComponents ? `
  private async initializeUIComponents(): Promise<void> {
    this.logger.info('Initializing UI components');
    
    // Register UI components
    this.sdk.ui.registerComponent('PluginDashboard', this.renderDashboard.bind(this));
    this.sdk.ui.registerComponent('PluginSettings', this.renderSettings.bind(this));
  }

  private async cleanupUIComponents(): Promise<void> {
    this.sdk.ui.unregisterComponent('PluginDashboard');
    this.sdk.ui.unregisterComponent('PluginSettings');
  }

  private renderDashboard(): string {
    return \`
      <div class="${pluginName}-dashboard">
        <h2>${this.toPascalCase(pluginName)} Dashboard</h2>
        <p>Plugin is ${this.config.enabled ? 'enabled' : 'disabled'}</p>
        <div class="plugin-stats">
          <!-- Add your dashboard content here -->
        </div>
      </div>
    \`;
  }

  private renderSettings(): string {
    return \`
      <div class="${pluginName}-settings">
        <h2>${this.toPascalCase(pluginName)} Settings</h2>
        <form class="plugin-config-form">
          <div class="form-group">
            <label for="apiKey">API Key</label>
            <input type="password" id="apiKey" name="apiKey" value="${this.config.apiKey}" />
          </div>
          <div class="form-group">
            <label for="webhookUrl">Webhook URL</label>
            <input type="url" id="webhookUrl" name="webhookUrl" value="${this.config.webhookUrl || ''}" />
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="enabled" ${this.config.enabled ? 'checked' : ''} />
              Enable Plugin
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="debug" ${this.config.debug ? 'checked' : ''} />
              Debug Mode
            </label>
          </div>
          <button type="submit">Save Settings</button>
        </form>
      </div>
    \`;
  }
` : ''}

${features.apiEndpoints ? `
  private async initializeAPIEndpoints(): Promise<void> {
    this.logger.info('Initializing API endpoints');
    
    // Register API endpoints
    this.sdk.api.register('GET', '/plugins/${pluginName}/status', this.getStatus.bind(this));
    this.sdk.api.register('POST', '/plugins/${pluginName}/configure', this.updateConfiguration.bind(this));
  }

  private async cleanupAPIEndpoints(): Promise<void> {
    this.sdk.api.unregister('GET', '/plugins/${pluginName}/status');
    this.sdk.api.unregister('POST', '/plugins/${pluginName}/configure');
  }

  private async getStatus(req: any, res: any): Promise<void> {
    const status = {
      pluginName: '${pluginName}',
      enabled: this.config.enabled,
      version: '${version}',
      uptime: process.uptime(),
      config: {
        enabled: this.config.enabled,
        debug: this.config.debug
      }
    };
    
    res.json({ success: true, data: status });
  }

  private async updateConfiguration(req: any, res: any): Promise<void> {
    try {
      const newConfig = configSchema.parse(req.body);
      this.config = newConfig;
      
      // Save configuration
      await this.sdk.config.save(this.config);
      
      res.json({ 
        success: true, 
        message: 'Configuration updated successfully',
        data: this.config
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid configuration',
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Failed to update configuration' 
        });
      }
    }
  }
` : ''}

  // Utility methods
  private toPascalCase(str: string): string {
    return str.replace(/(?:^|\\s|[-_])\\w/g, (match) => match.toUpperCase()).replace(/[-_]/g, '');
  }
}

// Plugin factory function
export function createPlugin(context: PluginContext): ${this.toPascalCase(pluginName)}Plugin {
  return new ${this.toPascalCase(pluginName)}Plugin(context);
}

// Default export
export default createPlugin;
`;
    } else {
      // JavaScript version
      content += `const { PluginSDK } = require('@mnbara/plugin-sdk');

class ${this.toPascalCase(pluginName)}Plugin {
  constructor(context) {
    this.context = context;
    this.sdk = context.sdk;
    this.logger = context.logger;
    this.config = context.config || {};
  }

  async initialize() {
    this.logger.info('Initializing ${pluginName} plugin');
    
    // Add your initialization logic here
    
    this.logger.info('${pluginName} plugin initialized successfully');
  }

  async destroy() {
    this.logger.info('Destroying ${pluginName} plugin');
    
    // Add your cleanup logic here
    
    this.logger.info('${pluginName} plugin destroyed successfully');
  }
}

function createPlugin(context) {
  return new ${this.toPascalCase(pluginName)}Plugin(context);
}

module.exports = { createPlugin, ${this.toPascalCase(pluginName)}Plugin };
module.exports.default = createPlugin;
`;
    }

    const srcDir = path.join(pluginDir, features.typescript ? 'src' : '');
    if (features.typescript && !fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    fs.writeFileSync(path.join(pluginDir, mainFile), content);
  }

  private async generateConfiguration(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.configuration) return;

    const configContent = {
      enabled: true,
      debug: false,
      apiKey: '',
      webhookUrl: ''
    };

    fs.writeFileSync(
      path.join(pluginDir, 'config.json'),
      JSON.stringify(configContent, null, 2)
    );
  }

  private async generateTypes(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    
    if (!features.typescript) return;

    const typesContent = `import { PluginContext, HookContext, WalletContext } from '@mnbara/plugin-sdk';

// Plugin-specific types
export interface ${this.toPascalCase(pluginName)}Config {
  enabled: boolean;
  debug: boolean;
  apiKey: string;
  webhookUrl?: string;
}

export interface ${this.toPascalCase(pluginName)}State {
  initialized: boolean;
  status: 'active' | 'inactive' | 'error';
  lastActivity?: Date;
  metrics: {
    transactionsProcessed: number;
    errors: number;
    uptime: number;
  };
}

export interface ${this.toPascalCase(pluginName)}Hooks {
  'transaction:created': (context: HookContext) => Promise<void>;
  'transaction:completed': (context: HookContext) => Promise<void>;
  'plugin:activated': (context: HookContext) => Promise<void>;
  'plugin:deactivated': (context: HookContext) => Promise<void>;
}

export interface ${this.toPascalCase(pluginName)}API {
  getStatus(): Promise<${this.toPascalCase(pluginName)}State>;
  updateConfiguration(config: Partial<${this.toPascalCase(pluginName)}Config>): Promise<void>;
  resetMetrics(): Promise<void>;
}
`;

    fs.writeFileSync(path.join(pluginDir, 'src/types.ts'), typesContent);
  }

  private async generateHooks(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    
    if (!features.hooks) return;

    const fileExtension = features.typescript ? 'ts' : 'js';
    const hooksContent = features.typescript ? `import { HookContext } from '@mnbara/plugin-sdk';
import { ${this.toPascalCase(pluginName)}Config } from './types';

export class ${this.toPascalCase(pluginName)}Hooks {
  constructor(private config: ${this.toPascalCase(pluginName)}Config) {}

  async onTransactionCreated(context: HookContext): Promise<void> {
    // Handle transaction created event
    console.log('Transaction created:', context.data);
  }

  async onTransactionCompleted(context: HookContext): Promise<void> {
    // Handle transaction completed event
    console.log('Transaction completed:', context.data);
  }

  async onPluginActivated(context: HookContext): Promise<void> {
    // Handle plugin activation
    console.log('Plugin activated:', context.data);
  }

  async onPluginDeactivated(context: HookContext): Promise<void> {
    // Handle plugin deactivation
    console.log('Plugin deactivated:', context.data);
  }
}
` : `class ${this.toPascalCase(pluginName)}Hooks {
  constructor(config) {
    this.config = config;
  }

  async onTransactionCreated(context) {
    // Handle transaction created event
    console.log('Transaction created:', context.data);
  }

  async onTransactionCompleted(context) {
    // Handle transaction completed event
    console.log('Transaction completed:', context.data);
  }

  async onPluginActivated(context) {
    // Handle plugin activation
    console.log('Plugin activated:', context.data);
  }

  async onPluginDeactivated(context) {
    // Handle plugin deactivation
    console.log('Plugin deactivated:', context.data);
  }
}

module.exports = { ${this.toPascalCase(pluginName)}Hooks };
`;

    const hooksDir = path.join(pluginDir, features.typescript ? 'src' : '', 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    fs.writeFileSync(path.join(hooksDir, `hooks.${fileExtension}`), hooksContent);
  }

  private async generateWalletIntegration(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    
    if (!features.walletIntegration) return;

    const fileExtension = features.typescript ? 'ts' : 'js';
    const walletContent = features.typescript ? `import { WalletContext, Transaction } from '@mnbara/plugin-sdk';
import { ${this.toPascalCase(pluginName)}Config } from './types';

export class ${this.toPascalCase(pluginName)}WalletIntegration {
  constructor(private config: ${this.toPascalCase(pluginName)}Config) {}

  async onTransactionSubmitted(context: WalletContext): Promise<void> {
    const { transactionId, from, to, value, chainId } = context;
    
    console.log(\`Transaction submitted: \${transactionId}\`);
    
    // Add your transaction processing logic here
    if (this.config.debug) {
      console.log('Transaction details:', { from, to, value, chainId });
    }
  }

  async onTransactionConfirmed(context: WalletContext): Promise<void> {
    const { transactionId, receipt } = context;
    
    console.log(\`Transaction confirmed: \${transactionId}\`);
    
    // Add your confirmation processing logic here
    if (receipt && this.config.debug) {
      console.log('Transaction receipt:', receipt);
    }
  }

  async onBalanceChanged(context: WalletContext): Promise<void> {
    const { address, balance, previousBalance, token } = context;
    
    console.log(\`Balance changed for \${address}: \${previousBalance} → \${balance}\`);
    
    // Add your balance change processing logic here
    if (token && this.config.debug) {
      console.log('Token details:', token);
    }
  }

  async getSupportedChains(): Promise<string[]> {
    return ['ethereum', 'polygon', 'bsc', 'arbitrum'];
  }

  async getTransactionTypes(): Promise<string[]> {
    return ['transfer', 'swap', 'stake', 'unstake'];
  }
}
` : `class ${this.toPascalCase(pluginName)}WalletIntegration {
  constructor(config) {
    this.config = config;
  }

  async onTransactionSubmitted(context) {
    const { transactionId, from, to, value, chainId } = context;
    
    console.log(\`Transaction submitted: \${transactionId}\`);
    
    // Add your transaction processing logic here
    if (this.config.debug) {
      console.log('Transaction details:', { from, to, value, chainId });
    }
  }

  async onTransactionConfirmed(context) {
    const { transactionId, receipt } = context;
    
    console.log(\`Transaction confirmed: \${transactionId}\`);
    
    // Add your confirmation processing logic here
    if (receipt && this.config.debug) {
      console.log('Transaction receipt:', receipt);
    }
  }

  async onBalanceChanged(context) {
    const { address, balance, previousBalance, token } = context;
    
    console.log(\`Balance changed for \${address}: \${previousBalance} → \${balance}\`);
    
    // Add your balance change processing logic here
    if (token && this.config.debug) {
      console.log('Token details:', token);
    }
  }

  async getSupportedChains() {
    return ['ethereum', 'polygon', 'bsc', 'arbitrum'];
  }

  async getTransactionTypes() {
    return ['transfer', 'swap', 'stake', 'unstake'];
  }
}

module.exports = { ${this.toPascalCase(pluginName)}WalletIntegration };
`;

    const walletDir = path.join(pluginDir, features.typescript ? 'src' : '', 'wallet');
    if (!fs.existsSync(walletDir)) {
      fs.mkdirSync(walletDir, { recursive: true });
    }

    fs.writeFileSync(path.join(walletDir, `wallet-integration.${fileExtension}`), walletContent);
  }

  private async generateUIComponents(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    
    if (!features.uiComponents) return;

    const fileExtension = features.typescript ? 'tsx' : 'jsx';
    const uiContent = features.typescript ? `import React, { useState, useEffect } from 'react';
import { usePluginSDK } from '@mnbara/plugin-sdk';

interface DashboardProps {
  className?: string;
}

export const PluginDashboard: React.FC<DashboardProps> = ({ className }) => {
  const sdk = usePluginSDK();
  const [status, setStatus] = useState<string>('loading');
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await sdk.api.get('/plugins/${pluginName}/status');
        setStatus('active');
        setMetrics(response.data);
      } catch (error) {
        setStatus('error');
        console.error('Failed to fetch plugin status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [sdk]);

  if (status === 'loading') {
    return <div className={\`dashboard-loading \${className || ''}\`}>Loading...</div>;
  }

  if (status === 'error') {
    return <div className={\`dashboard-error \${className || ''}\`}>Error loading dashboard</div>;
  }

  return (
    <div className={\`${pluginName}-dashboard \${className || ''}\`}>
      <div className="dashboard-header">
        <h2>${this.toPascalCase(pluginName)} Dashboard</h2>
        <div className="status-indicator">
          <span className={\`status-\${metrics?.config?.enabled ? 'enabled' : 'disabled'}\`}>
            {metrics?.config?.enabled ? '●' : '○'}
          </span>
          <span>{metrics?.config?.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Plugin Version</h3>
            <p>{metrics?.version || 'Unknown'}</p>
          </div>
          <div className="metric-card">
            <h3>Uptime</h3>
            <p>{formatUptime(metrics?.uptime || 0)}</p>
          </div>
          <div className="metric-card">
            <h3>Debug Mode</h3>
            <p>{metrics?.config?.debug ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
        
        <div className="actions-section">
          <button 
            onClick={() => window.open('/plugins/${pluginName}/settings', '_blank')}
            className="settings-button"
          >
            Plugin Settings
          </button>
        </div>
      </div>
    </div>
  );
};

function formatUptime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return \`\${hours}h \${minutes}m \${secs}s\`;
  } else if (minutes > 0) {
    return \`\${minutes}m \${secs}s\`;
  } else {
    return \`\${secs}s\`;
  }
}
` : `import React, { useState, useEffect } from 'react';
import { usePluginSDK } from '@mnbara/plugin-sdk';

export const PluginDashboard = ({ className }) => {
  const sdk = usePluginSDK();
  const [status, setStatus] = useState('loading');
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await sdk.api.get('/plugins/${pluginName}/status');
        setStatus('active');
        setMetrics(response.data);
      } catch (error) {
        setStatus('error');
        console.error('Failed to fetch plugin status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, [sdk]);

  if (status === 'loading') {
    return <div className={\`dashboard-loading \${className || ''}\`}>Loading...</div>;
  }

  if (status === 'error') {
    return <div className={\`dashboard-error \${className || ''}\`}>Error loading dashboard</div>;
  }

  return (
    <div className={\`${pluginName}-dashboard \${className || ''}\`}>
      <div className="dashboard-header">
        <h2>${this.toPascalCase(pluginName)} Dashboard</h2>
        <div className="status-indicator">
          <span className={\`status-\${metrics?.config?.enabled ? 'enabled' : 'disabled'}\`}>
            {metrics?.config?.enabled ? '●' : '○'}
          </span>
          <span>{metrics?.config?.enabled ? 'Enabled' : 'Disabled'}</span>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="metrics-grid">
          <div className="metric-card">
            <h3>Plugin Version</h3>
            <p>{metrics?.version || 'Unknown'}</p>
          </div>
          <div className="metric-card">
            <h3>Uptime</h3>
            <p>{formatUptime(metrics?.uptime || 0)}</p>
          </div>
          <div className="metric-card">
            <h3>Debug Mode</h3>
            <p>{metrics?.config?.debug ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
        
        <div className="actions-section">
          <button 
            onClick={() => window.open('/plugins/${pluginName}/settings', '_blank')}
            className="settings-button"
          >
            Plugin Settings
          </button>
        </div>
      </div>
    </div>
  );
};

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return \`\${hours}h \${minutes}m \${secs}s\`;
  } else if (minutes > 0) {
    return \`\${minutes}m \${secs}s\`;
  } else {
    return \`\${secs}s\`;
  }
}
`;

    const uiDir = path.join(pluginDir, features.typescript ? 'src' : '', 'components');
    if (!fs.existsSync(uiDir)) {
      fs.mkdirSync(uiDir, { recursive: true });
    }

    fs.writeFileSync(path.join(uiDir, `Dashboard.${fileExtension}`), uiContent);
  }

  private async generateAPIEndpoints(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    
    if (!features.apiEndpoints) return;

    const fileExtension = features.typescript ? 'ts' : 'js';
    const apiContent = features.typescript ? `import { Request, Response } from 'express';
import { ${this.toPascalCase(pluginName)}Config } from '../types';

export class ${this.toPascalCase(pluginName)}API {
  constructor(private config: ${this.toPascalCase(pluginName)}Config) {}

  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = {
        pluginName: '${pluginName}',
        enabled: this.config.enabled,
        version: '${this.options.version}',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        config: {
          enabled: this.config.enabled,
          debug: this.config.debug
        }
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get plugin status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const updates = req.body;
      
      // Validate configuration updates
      if (updates.enabled !== undefined) {
        this.config.enabled = Boolean(updates.enabled);
      }
      
      if (updates.debug !== undefined) {
        this.config.debug = Boolean(updates.debug);
      }
      
      if (updates.apiKey !== undefined) {
        this.config.apiKey = String(updates.apiKey);
      }
      
      if (updates.webhookUrl !== undefined) {
        this.config.webhookUrl = updates.webhookUrl ? String(updates.webhookUrl) : undefined;
      }

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: this.config
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = {
        pluginName: '${pluginName}',
        timestamp: new Date().toISOString(),
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          version: process.version
        },
        plugin: {
          enabled: this.config.enabled,
          debug: this.config.debug,
          version: '${this.options.version}'
        }
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
` : `class ${this.toPascalCase(pluginName)}API {
  constructor(config) {
    this.config = config;
  }

  async getStatus(req, res) {
    try {
      const status = {
        pluginName: '${pluginName}',
        enabled: this.config.enabled,
        version: '${this.options.version}',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        config: {
          enabled: this.config.enabled,
          debug: this.config.debug
        }
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get plugin status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateConfiguration(req, res) {
    try {
      const updates = req.body;
      
      // Validate configuration updates
      if (updates.enabled !== undefined) {
        this.config.enabled = Boolean(updates.enabled);
      }
      
      if (updates.debug !== undefined) {
        this.config.debug = Boolean(updates.debug);
      }
      
      if (updates.apiKey !== undefined) {
        this.config.apiKey = String(updates.apiKey);
      }
      
      if (updates.webhookUrl !== undefined) {
        this.config.webhookUrl = updates.webhookUrl ? String(updates.webhookUrl) : undefined;
      }

      res.json({
        success: true,
        message: 'Configuration updated successfully',
        data: this.config
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Failed to update configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getMetrics(req, res) {
    try {
      const metrics = {
        pluginName: '${pluginName}',
        timestamp: new Date().toISOString(),
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          version: process.version
        },
        plugin: {
          enabled: this.config.enabled,
          debug: this.config.debug,
          version: '${this.options.version}'
        }
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

module.exports = { ${this.toPascalCase(pluginName)}API };
`;

    const apiDir = path.join(pluginDir, features.typescript ? 'src' : '', 'api');
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    fs.writeFileSync(path.join(apiDir, `api.${fileExtension}`), apiContent);
  }

  private async generateTests(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    const fileExtension = features.typescript ? 'ts' : 'js';
    
    const testContent = features.typescript ? `import { createPlugin } from '../src/index';
import { PluginContext } from '@mnbara/plugin-sdk';

// Mock plugin context
const createMockContext = (): PluginContext => ({
  sdk: {
    hooks: {
      register: jest.fn(),
      unregister: jest.fn(),
      trigger: jest.fn()
    },
    wallet: {
      on: jest.fn(),
      off: jest.fn(),
      getBalance: jest.fn(),
      sendTransaction: jest.fn()
    },
    ui: {
      registerComponent: jest.fn(),
      unregisterComponent: jest.fn()
    },
    api: {
      register: jest.fn(),
      unregister: jest.fn()
    },
    config: {
      get: jest.fn(),
      set: jest.fn(),
      save: jest.fn()
    }
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  config: {
    enabled: true,
    debug: false,
    apiKey: 'test-api-key'
  }
});

describe('${this.toPascalCase(pluginName)}Plugin', () => {
  let plugin: any;
  let mockContext: PluginContext;

  beforeEach(() => {
    mockContext = createMockContext();
    plugin = createPlugin(mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid configuration', async () => {
      await plugin.initialize();
      
      expect(mockContext.logger.info).toHaveBeenCalledWith('Initializing ${pluginName} plugin');
      expect(mockContext.logger.info).toHaveBeenCalledWith('${pluginName} plugin initialized successfully');
    });

    it('should warn when plugin is disabled', async () => {
      mockContext.config.enabled = false;
      plugin = createPlugin(mockContext);
      
      await plugin.initialize();
      
      expect(mockContext.logger.warn).toHaveBeenCalledWith('Plugin is disabled in configuration');
    });

    it('should register hooks when hooks are enabled', async () => {
      await plugin.initialize();
      
      ${features.hooks ? `expect(mockContext.sdk.hooks.register).toHaveBeenCalled();` : ''}
    });
  });

  describe('destroy', () => {
    it('should destroy successfully', async () => {
      await plugin.destroy();
      
      expect(mockContext.logger.info).toHaveBeenCalledWith('Destroying ${pluginName} plugin');
      expect(mockContext.logger.info).toHaveBeenCalledWith('${pluginName} plugin destroyed successfully');
    });
  });

  ${features.hooks ? `
  describe('hooks', () => {
    it('should handle transaction created events', async () => {
      await plugin.initialize();
      
      const mockContext = { data: { transactionId: 'test-tx' } };
      await plugin.onTransactionCreated(mockContext);
      
      expect(mockContext.logger.debug).toHaveBeenCalledWith('Transaction created:', mockContext.data);
    });

    it('should handle transaction completed events', async () => {
      await plugin.initialize();
      
      const mockContext = { data: { transactionId: 'test-tx', status: 'completed' } };
      await plugin.onTransactionCompleted(mockContext);
      
      expect(mockContext.logger.debug).toHaveBeenCalledWith('Transaction completed:', mockContext.data);
    });
  });
  ` : ''}

  ${features.walletIntegration ? `
  describe('wallet integration', () => {
    it('should handle wallet transaction submitted', async () => {
      await plugin.initialize();
      
      const mockContext = { 
        transactionId: 'test-tx',
        from: '0x123',
        to: '0x456',
        value: '1000',
        chainId: 1
      };
      
      await plugin.onWalletTransactionSubmitted(mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalledWith('Wallet transaction submitted: test-tx');
    });

    it('should handle wallet balance changes', async () => {
      await plugin.initialize();
      
      const mockContext = { 
        address: '0x123',
        balance: '1000',
        previousBalance: '500',
        token: { symbol: 'ETH', decimals: 18 }
      };
      
      await plugin.onWalletBalanceChanged(mockContext);
      
      expect(mockContext.logger.info).toHaveBeenCalledWith('Balance changed for 0x123: 500 → 1000');
    });
  });
  ` : ''}
});
` : `const { createPlugin } = require('../src/index');

// Mock plugin context
const createMockContext = () => ({
  sdk: {
    hooks: {
      register: jest.fn(),
      unregister: jest.fn(),
      trigger: jest.fn()
    },
    wallet: {
      on: jest.fn(),
      off: jest.fn(),
      getBalance: jest.fn(),
      sendTransaction: jest.fn()
    },
    ui: {
      registerComponent: jest.fn(),
      unregisterComponent: jest.fn()
    },
    api: {
      register: jest.fn(),
      unregister: jest.fn()
    },
    config: {
      get: jest.fn(),
      set: jest.fn(),
      save: jest.fn()
    }
  },
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  },
  config: {
    enabled: true,
    debug: false,
    apiKey: 'test-api-key'
  }
});

describe('${this.toPascalCase(pluginName)}Plugin', () => {
  let plugin;
  let mockContext;

  beforeEach(() => {
    mockContext = createMockContext();
    plugin = createPlugin(mockContext);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize successfully with valid configuration', async () => {
      await plugin.initialize();
      
      expect(mockContext.logger.info).toHaveBeenCalledWith('Initializing ${pluginName} plugin');
      expect(mockContext.logger.info).toHaveBeenCalledWith('${pluginName} plugin initialized successfully');
    });

    it('should warn when plugin is disabled', async () => {
      mockContext.config.enabled = false;
      plugin = createPlugin(mockContext);
      
      await plugin.initialize();
      
      expect(mockContext.logger.warn).toHaveBeenCalledWith('Plugin is disabled in configuration');
    });
  });

  describe('destroy', () => {
    it('should destroy successfully', async () => {
      await plugin.destroy();
      
      expect(mockContext.logger.info).toHaveBeenCalledWith('Destroying ${pluginName} plugin');
      expect(mockContext.logger.info).toHaveBeenCalledWith('${pluginName} plugin destroyed successfully');
    });
  });
});
`;

    const testDir = path.join(pluginDir, 'tests');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    fs.writeFileSync(path.join(testDir, `plugin.test.${fileExtension}`), testContent);

    // Generate Jest configuration
    const jestConfig = features.typescript ? {
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/*.test.ts'],
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html'],
      moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1'
      }
    } : {
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/*.test.js'],
      collectCoverageFrom: [
        '**/*.js',
        '!node_modules/**',
        '!tests/**',
        '!jest.config.js'
      ],
      coverageDirectory: 'coverage',
      coverageReporters: ['text', 'lcov', 'html']
    };

    fs.writeFileSync(
      path.join(pluginDir, 'jest.config.json'),
      JSON.stringify(jestConfig, null, 2)
    );
  }

  private async generateDocumentation(pluginDir: string): Promise<void> {
    const { pluginName, description, author, version, features } = this.options;
    
    const readmeContent = `# ${this.toPascalCase(pluginName)} Plugin

${description}

## Features

${features.walletIntegration ? '- **Wallet Integration**: Seamlessly integrate with MNBara wallet for transaction monitoring and balance tracking' : ''}
${features.hooks ? '- **Hook System**: Register and respond to system events' : ''}
${features.uiComponents ? '- **UI Components**: Custom dashboard and settings components' : ''}
${features.apiEndpoints ? '- **API Endpoints**: RESTful API for plugin management' : ''}
${features.configuration ? '- **Configuration Management**: Flexible configuration system with validation' : ''}
${features.typescript ? '- **TypeScript Support**: Full TypeScript support with type definitions' : ''}

## Installation

\`\`\`bash
npm install @mnbara/${pluginName}
\`\`\`

## Configuration

${features.configuration ? `Create a \`config.json\` file in your plugin directory:

\`\`\`json
{
  "enabled": true,
  "debug": false,
  "apiKey": "your-api-key",
  "webhookUrl": "https://your-webhook-url.com"
}
\`\`\`` : 'No configuration required.'}

## Usage

${features.typescript ? `\`\`\`typescript
import { createPlugin } from '@mnbara/${pluginName}';
import { PluginContext } from '@mnbara/plugin-sdk';

const context: PluginContext = {
  // Your plugin context
};

const plugin = createPlugin(context);
await plugin.initialize();
\`\`\`` : `\`\`\`javascript
const { createPlugin } = require('@mnbara/${pluginName}');

const context = {
  // Your plugin context
};

const plugin = createPlugin(context);
await plugin.initialize();
\`\`\``}

## API Reference

${features.apiEndpoints ? `### GET /plugins/${pluginName}/status

Get plugin status and health information.

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "pluginName": "${pluginName}",
    "enabled": true,
    "version": "${version}",
    "uptime": 3600,
    "config": {
      "enabled": true,
      "debug": false
    }
  }
}
\`\`\`

### POST /plugins/${pluginName}/configure

Update plugin configuration.

**Request:**
\`\`\`json
{
  "enabled": true,
  "debug": false,
  "apiKey": "new-api-key"
}
\`\`\`` : 'No API endpoints available.'}

## Development

### Building the Plugin

\`\`\`bash
npm run build
\`\`\`

### Running Tests

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

### Development Mode

\`\`\`bash
npm run dev
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add some amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**${author}**

## Support

For support, please open an issue in the GitHub repository or contact the author.
`;

    fs.writeFileSync(path.join(pluginDir, 'README.md'), readmeContent);

    // Generate LICENSE file
    const licenseContent = `MIT License

Copyright (c) ${new Date().getFullYear()} ${author}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

    fs.writeFileSync(path.join(pluginDir, 'LICENSE'), licenseContent);
  }

  private async generateBuildConfig(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.typescript) return;

    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        resolveJsonModule: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        baseUrl: './',
        paths: {
          '@/*': ['src/*']
        }
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests', '**/*.test.ts', '**/*.spec.ts']
    };

    fs.writeFileSync(
      path.join(pluginDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  private async generateGitignore(pluginDir: string): Promise<void> {
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs/
*.log

# Coverage reports
coverage/
*.lcov

# Temporary files
tmp/
temp/

# Plugin specific
plugin-data/
*.plugin-cache
`;

    fs.writeFileSync(path.join(pluginDir, '.gitignore'), gitignoreContent);
  }

  private async generateESLintConfig(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    const eslintConfig = features.typescript ? {
      parser: '@typescript-eslint/parser',
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended'
      ],
      plugins: ['@typescript-eslint'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      rules: {
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        'no-console': 'warn',
        'no-debugger': 'error'
      },
      env: {
        node: true,
        es6: true,
        jest: true
      }
    } : {
      extends: ['eslint:recommended'],
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      },
      rules: {
        'no-unused-vars': 'error',
        'no-console': 'warn',
        'no-debugger': 'error'
      },
      env: {
        node: true,
        es6: true,
        jest: true
      }
    };

    fs.writeFileSync(
      path.join(pluginDir, '.eslintrc.json'),
      JSON.stringify(eslintConfig, null, 2)
    );
  }

  private async generatePrettierConfig(pluginDir: string): Promise<void> {
    const prettierConfig = {
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      bracketSpacing: true,
      arrowParens: 'avoid',
      endOfLine: 'lf'
    };

    fs.writeFileSync(
      path.join(pluginDir, '.prettierrc.json'),
      JSON.stringify(prettierConfig, null, 2)
    );
  }

  // Utility method to convert to PascalCase
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

// CLI interface
export function generatePluginTemplate(options: PluginTemplateOptions): Promise<void> {
  const generator = new PluginTemplateGenerator(options);
  return generator.generate();
}

// Export types for external use
export type { PluginTemplateOptions };