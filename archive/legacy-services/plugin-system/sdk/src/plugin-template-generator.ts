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
      name: `@mnbara/plugin-${pluginName.toLowerCase().replace(/\s+/g, '-')}`,
      version,
      description,
      author,
      main: features.typescript ? 'dist/index.js' : 'src/index.js',
      types: features.typescript ? 'dist/index.d.ts' : undefined,
      scripts: {
        build: features.typescript ? 'tsc' : 'echo "No build step required"',
        dev: features.typescript ? 'tsc --watch' : 'nodemon src/index.js',
        test: 'jest',
        'test:watch': 'jest --watch',
        lint: features.typescript ? 'eslint src/**/*.ts' : 'eslint src/**/*.js',
        'lint:fix': features.typescript ? 'eslint src/**/*.ts --fix' : 'eslint src/**/*.js --fix',
        format: 'prettier --write "src/**/*.{js,ts,json,md}"',
        prepublishOnly: 'npm run build && npm test'
      },
      keywords: [
        'mnbara',
        'plugin',
        pluginName.toLowerCase()
      ],
      license: 'MIT',
      dependencies: {
        '@mnbara/plugin-sdk': '^1.0.0'
      },
      devDependencies: {
        ...(features.typescript && {
          typescript: '^5.0.0',
          '@types/node': '^20.0.0',
          '@types/jest': '^29.0.0',
          '@typescript-eslint/eslint-plugin': '^6.0.0',
          '@typescript-eslint/parser': '^6.0.0'
        }),
        jest: '^29.0.0',
        eslint: '^8.0.0',
        prettier: '^3.0.0',
        nodemon: '^3.0.0'
      },
      peerDependencies: {
        '@mnbara/plugin-system': '^1.0.0'
      },
      engines: {
        node: '>=16.0.0'
      }
    };

    // Remove undefined values
    Object.keys(packageJson).forEach(key => {
      if (packageJson[key as keyof typeof packageJson] === undefined) {
        delete packageJson[key as keyof typeof packageJson];
      }
    });

    fs.writeFileSync(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  private async generateManifest(pluginDir: string): Promise<void> {
    const { pluginName, pluginId, description, author, version, type, features } = this.options;
    
    const manifest = {
      metadata: {
        id: pluginId,
        name: pluginName,
        version,
        description,
        author,
        keywords: [pluginName.toLowerCase()],
        license: 'MIT'
      },
      entry: features.typescript ? 'dist/index.js' : 'src/index.js',
      enabled: true,
      permissions: this.generatePermissions(),
      configuration: {
        settings: {},
        features: {
          typescript: features.typescript,
          hooks: features.hooks,
          walletIntegration: features.walletIntegration,
          uiComponents: features.uiComponents,
          apiEndpoints: features.apiEndpoints,
          storage: true,
          cache: false,
          metrics: true
        },
        development: {
          hotReload: true,
          debug: true,
          mockData: false
        },
        production: {
          minify: true,
          optimize: true,
          compress: true
        }
      },
      hooks: features.hooks ? {
        onInstall: ['onInstall'],
        onEnable: ['onEnable'],
        onDisable: ['onDisable'],
        onUninstall: ['onUninstall'],
        ...(features.walletIntegration && {
          onWalletConnect: ['onWalletConnect'],
          onWalletDisconnect: ['onWalletDisconnect']
        })
      } : undefined,
      wallet: features.walletIntegration ? {
        supportedChains: ['ethereum', 'polygon'],
        features: ['connect', 'disconnect', 'get-balance', 'send-transaction', 'sign-message']
      } : undefined,
      ui: features.uiComponents ? {
        components: ['MainComponent'],
        themes: ['light', 'dark']
      } : undefined,
      api: features.apiEndpoints ? {
        endpoints: ['/api/hello'],
        rateLimits: {
          windowMs: 900000, // 15 minutes
          max: 100
        }
      } : undefined
    };

    // Remove undefined values
    Object.keys(manifest).forEach(key => {
      if (manifest[key as keyof typeof manifest] === undefined) {
        delete manifest[key as keyof typeof manifest];
      }
    });

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  }

  private generatePermissions() {
    const { type, features } = this.options;
    
    switch (type) {
      case 'wallet-integration':
        return {
          wallet: { read: true, write: true, sign: true, admin: false },
          api: { external: true, internal: true, admin: false },
          ui: { render: true, modify: true, admin: false },
          hooks: { register: true, trigger: true, admin: false },
          storage: { read: true, write: true, admin: false },
          system: { network: true, filesystem: false, process: false, admin: false }
        };
      
      case 'hook-provider':
        return {
          wallet: { read: false, write: false, sign: false, admin: false },
          api: { external: false, internal: true, admin: false },
          ui: { render: false, modify: false, admin: false },
          hooks: { register: true, trigger: true, admin: false },
          storage: { read: true, write: true, admin: false },
          system: { network: false, filesystem: false, process: false, admin: false }
        };
      
      case 'ui-component':
        return {
          wallet: { read: false, write: false, sign: false, admin: false },
          api: { external: false, internal: true, admin: false },
          ui: { render: true, modify: true, admin: false },
          hooks: { register: true, trigger: true, admin: false },
          storage: { read: true, write: true, admin: false },
          system: { network: false, filesystem: false, process: false, admin: false }
        };
      
      case 'api-service':
        return {
          wallet: { read: false, write: false, sign: false, admin: false },
          api: { external: true, internal: true, admin: false },
          ui: { render: false, modify: false, admin: false },
          hooks: { register: true, trigger: true, admin: false },
          storage: { read: true, write: true, admin: false },
          system: { network: true, filesystem: false, process: false, admin: false }
        };
      
      default: // basic
        return {
          wallet: { read: false, write: false, sign: false, admin: false },
          api: { external: false, internal: true, admin: false },
          ui: { render: true, modify: false, admin: false },
          hooks: { register: true, trigger: true, admin: false },
          storage: { read: true, write: true, admin: false },
          system: { network: false, filesystem: false, process: false, admin: false }
        };
    }
  }

  private async generateMainFile(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    const fileExtension = features.typescript ? 'ts' : 'js';
    const srcDir = path.join(pluginDir, 'src');
    
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }

    const mainContent = features.typescript ? 
      this.generateTypeScriptMainFile(pluginName, features) :
      this.generateJavaScriptMainFile(pluginName, features);

    fs.writeFileSync(
      path.join(srcDir, `index.${fileExtension}`),
      mainContent
    );
  }

  private generateTypeScriptMainFile(pluginName: string, features: any): string {
    const imports = [
      "import { PluginSDK, PluginConfig } from '@mnbara/plugin-sdk';",
      ...(features.hooks ? ["import { HookContext } from '@mnbara/plugin-sdk';"] : []),
      ...(features.walletIntegration ? ["import { WalletContext } from '@mnbara/plugin-sdk';"] : []),
      ...(features.uiComponents ? ["import { UIContext } from '@mnbara/plugin-sdk';"] : []),
      ...(features.apiEndpoints ? ["import { APIContext } from '@mnbara/plugin-sdk';"] : [])
    ].join('\n');

    const hooks = features.hooks ? `
// Hook handlers
export async function onInstall(context: HookContext): Promise<void> {
  context.log('info', '${pluginName} installed successfully');
}

export async function onEnable(context: HookContext): Promise<void> {
  context.log('info', '${pluginName} enabled');
}

export async function onDisable(context: HookContext): Promise<void> {
  context.log('info', '${pluginName} disabled');
}

export async function onUninstall(context: HookContext): Promise<void> {
  context.log('info', '${pluginName} uninstalled');
}

${features.walletIntegration ? `
export async function onWalletConnect(context: WalletContext): Promise<void> {
  context.log('info', 'Wallet connected', { address: context.address });
}

export async function onWalletDisconnect(context: WalletContext): Promise<void> {
  context.log('info', 'Wallet disconnected');
}
` : ''}
` : '';

    const walletIntegration = features.walletIntegration ? `
// Wallet integration
export async function connectWallet(context: WalletContext): Promise<void> {
  await context.connect();
  context.log('info', 'Wallet connected', { address: context.address });
}

export async function getWalletBalance(context: WalletContext): Promise<void> {
  const balance = await context.getBalance({
    address: context.address,
    chain: context.chain,
    type: 'native'
  });
  context.log('info', 'Wallet balance', { balance });
}
` : '';

    const uiComponents = features.uiComponents ? `
// UI components
export function MainComponent(): JSX.Element {
  return (
    <div className="${pluginName.toLowerCase().replace(/\s+/g, '-')}-main">
      <h1>${pluginName}</h1>
      <p>Welcome to ${pluginName}!</p>
    </div>
  );
}
` : '';

    const apiEndpoints = features.apiEndpoints ? `
// API endpoints
export async function helloAPI(context: APIContext): Promise<any> {
  return {
    message: 'Hello from ${pluginName}!',
    timestamp: new Date().toISOString(),
    plugin: context.metadata.name
  };
}
` : '';

    return `${imports}

// Plugin configuration
const config: PluginConfig = {
  metadata: {
    id: '${pluginName.toLowerCase().replace(/\s+/g, '-')}',
    name: '${pluginName}',
    version: '1.0.0',
    description: 'A MNBara plugin',
    author: 'Your Name'
  },
  manifest: require('../plugin.manifest.json')
};

// Initialize plugin
const plugin = new PluginSDK(config);

// Main plugin function
export async function main(): Promise<void> {
  await plugin.initialize();
  const context = plugin.getContext();
  
  context.log('info', '${pluginName} plugin started');
  
  // Plugin logic here
  context.log('info', '${pluginName} plugin logic executed');
}

${hooks}

${walletIntegration}

${uiComponents}

${apiEndpoints}

// Export plugin instance
export default plugin;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
`;
  }

  private generateJavaScriptMainFile(pluginName: string, features: any): string {
    // Similar to TypeScript version but without type annotations
    return `
const { PluginSDK } = require('@mnbara/plugin-sdk');

// Plugin configuration
const config = {
  metadata: {
    id: '${pluginName.toLowerCase().replace(/\s+/g, '-')}',
    name: '${pluginName}',
    version: '1.0.0',
    description: 'A MNBara plugin',
    author: 'Your Name'
  },
  manifest: require('../plugin.manifest.json')
};

// Initialize plugin
const plugin = new PluginSDK(config);

// Main plugin function
async function main() {
  await plugin.initialize();
  const context = plugin.getContext();
  
  context.log('info', '${pluginName} plugin started');
  
  // Plugin logic here
  context.log('info', '${pluginName} plugin logic executed');
}

// Hook handlers
${features.hooks ? `
async function onInstall(context) {
  context.log('info', '${pluginName} installed successfully');
}

async function onEnable(context) {
  context.log('info', '${pluginName} enabled');
}

async function onDisable(context) {
  context.log('info', '${pluginName} disabled');
}

async function onUninstall(context) {
  context.log('info', '${pluginName} uninstalled');
}
` : ''}

${features.walletIntegration ? `
// Wallet integration
async function connectWallet(context) {
  await context.connect();
  context.log('info', 'Wallet connected', { address: context.address });
}

async function getWalletBalance(context) {
  const balance = await context.getBalance({
    address: context.address,
    chain: context.chain,
    type: 'native'
  });
  context.log('info', 'Wallet balance', { balance });
}
` : ''}

${features.uiComponents ? `
// UI components (React example)
function MainComponent() {
  return React.createElement('div', { 
    className: '${pluginName.toLowerCase().replace(/\s+/g, '-')}-main' 
  }, [
    React.createElement('h1', { key: 'title' }, '${pluginName}'),
    React.createElement('p', { key: 'description' }, 'Welcome to ${pluginName}!')
  ]);
}
` : ''}

${features.apiEndpoints ? `
// API endpoints
async function helloAPI(context) {
  return {
    message: 'Hello from ${pluginName}!',
    timestamp: new Date().toISOString(),
    plugin: context.metadata.name
  };
}
` : ''}

// Export plugin instance
module.exports = plugin;
module.exports.main = main;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
`;
  }

  private async generateConfiguration(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.configuration) return;

    const config = {
      settings: {
        debug: false,
        timeout: 30000,
        retries: 3
      },
      features: {
        logging: true,
        caching: false,
        rateLimiting: true
      }
    };

    fs.writeFileSync(
      path.join(pluginDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );
  }

  private async generateTypes(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.typescript) return;

    const srcDir = path.join(pluginDir, 'src');
    const typesContent = `
export interface PluginConfig {
  debug?: boolean;
  timeout?: number;
  retries?: number;
}

export interface PluginState {
  isInitialized: boolean;
  isConnected: boolean;
  lastActivity?: Date;
}

export interface PluginData {
  id: string;
  name: string;
  value: any;
  timestamp: Date;
}
`;

    fs.writeFileSync(
      path.join(srcDir, 'types.ts'),
      typesContent.trim()
    );
  }

  private async generateHooks(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.hooks) return;

    const srcDir = path.join(pluginDir, 'src');
    const fileExtension = features.typescript ? 'ts' : 'js';
    
    const hooksContent = features.typescript ? `
import { HookContext } from '@mnbara/plugin-sdk';

export async function onInstall(context: HookContext): Promise<void> {
  context.log('info', 'Plugin installed');
}

export async function onEnable(context: HookContext): Promise<void> {
  context.log('info', 'Plugin enabled');
}

export async function onDisable(context: HookContext): Promise<void> {
  context.log('info', 'Plugin disabled');
}

export async function onUninstall(context: HookContext): Promise<void> {
  context.log('info', 'Plugin uninstalled');
}
` : `
async function onInstall(context) {
  context.log('info', 'Plugin installed');
}

async function onEnable(context) {
  context.log('info', 'Plugin enabled');
}

async function onDisable(context) {
  context.log('info', 'Plugin disabled');
}

async function onUninstall(context) {
  context.log('info', 'Plugin uninstalled');
}

module.exports = {
  onInstall,
  onEnable,
  onDisable,
  onUninstall
};
`;

    fs.writeFileSync(
      path.join(srcDir, `hooks.${fileExtension}`),
      hooksContent.trim()
    );
  }

  private async generateWalletIntegration(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.walletIntegration) return;

    const srcDir = path.join(pluginDir, 'src');
    const fileExtension = features.typescript ? 'ts' : 'js';
    
    const walletContent = features.typescript ? `
import { WalletContext, BalanceRequest, TransactionRequest } from '@mnbara/plugin-sdk';

export async function connectWallet(context: WalletContext): Promise<void> {
  try {
    await context.connect();
    context.log('info', 'Wallet connected', { address: context.address });
  } catch (error) {
    context.log('error', 'Failed to connect wallet', { error });
    throw error;
  }
}

export async function getBalance(context: WalletContext, request: BalanceRequest): Promise<any> {
  try {
    const balance = await context.getBalance(request);
    context.log('info', 'Balance retrieved', { balance });
    return balance;
  } catch (error) {
    context.log('error', 'Failed to get balance', { error });
    throw error;
  }
}

export async function sendTransaction(context: WalletContext, request: TransactionRequest): Promise<any> {
  try {
    const tx = await context.sendTransaction(request);
    context.log('info', 'Transaction sent', { hash: tx.hash });
    return tx;
  } catch (error) {
    context.log('error', 'Failed to send transaction', { error });
    throw error;
  }
}
` : `
async function connectWallet(context) {
  try {
    await context.connect();
    context.log('info', 'Wallet connected', { address: context.address });
  } catch (error) {
    context.log('error', 'Failed to connect wallet', { error });
    throw error;
  }
}

async function getBalance(context, request) {
  try {
    const balance = await context.getBalance(request);
    context.log('info', 'Balance retrieved', { balance });
    return balance;
  } catch (error) {
    context.log('error', 'Failed to get balance', { error });
    throw error;
  }
}

async function sendTransaction(context, request) {
  try {
    const tx = await context.sendTransaction(request);
    context.log('info', 'Transaction sent', { hash: tx.hash });
    return tx;
  } catch (error) {
    context.log('error', 'Failed to send transaction', { error });
    throw error;
  }
}

module.exports = {
  connectWallet,
  getBalance,
  sendTransaction
};
`;

    fs.writeFileSync(
      path.join(srcDir, `wallet.${fileExtension}`),
      walletContent.trim()
    );
  }

  private async generateUIComponents(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.uiComponents) return;

    const srcDir = path.join(pluginDir, 'src');
    const componentsDir = path.join(srcDir, 'components');
    
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }

    const fileExtension = features.typescript ? 'tsx' : 'jsx';
    
    const componentContent = features.typescript ? `
import React from 'react';

export interface MainComponentProps {
  title?: string;
  description?: string;
}

export const MainComponent: React.FC<MainComponentProps> = ({ 
  title = 'My Plugin',
  description = 'Welcome to my plugin!'
}) => {
  return (
    <div className="plugin-main">
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
};

export default MainComponent;
` : `
import React from 'react';

function MainComponent({ title = 'My Plugin', description = 'Welcome to my plugin!' }) {
  return React.createElement('div', { className: 'plugin-main' }, [
    React.createElement('h1', { key: 'title' }, title),
    React.createElement('p', { key: 'description' }, description)
  ]);
}

module.exports = MainComponent;
`;

    fs.writeFileSync(
      path.join(componentsDir, `MainComponent.${fileExtension}`),
      componentContent.trim()
    );
  }

  private async generateAPIEndpoints(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.apiEndpoints) return;

    const srcDir = path.join(pluginDir, 'src');
    const apiDir = path.join(srcDir, 'api');
    
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    const fileExtension = features.typescript ? 'ts' : 'js';
    
    const apiContent = features.typescript ? `
import { APIContext } from '@mnbara/plugin-sdk';

export interface HelloResponse {
  message: string;
  timestamp: string;
  plugin: string;
}

export async function hello(context: APIContext): Promise<HelloResponse> {
  context.log('info', 'Hello API called');
  
  return {
    message: 'Hello from MNBara Plugin!',
    timestamp: new Date().toISOString(),
    plugin: context.metadata.name
  };
}

export async function health(context: APIContext): Promise<any> {
  context.log('info', 'Health check called');
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    plugin: context.metadata.name,
    version: context.metadata.version
  };
}
` : `
async function hello(context) {
  context.log('info', 'Hello API called');
  
  return {
    message: 'Hello from MNBara Plugin!',
    timestamp: new Date().toISOString(),
    plugin: context.metadata.name
  };
}

async function health(context) {
  context.log('info', 'Health check called');
  
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    plugin: context.metadata.name,
    version: context.metadata.version
  };
}

module.exports = {
  hello,
  health
};
`;

    fs.writeFileSync(
      path.join(apiDir, `endpoints.${fileExtension}`),
      apiContent.trim()
    );
  }

  private async generateTests(pluginDir: string): Promise<void> {
    const { pluginName, features } = this.options;
    
    const testDir = path.join(pluginDir, 'tests');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    const fileExtension = features.typescript ? 'ts' : 'js';
    
    const testContent = features.typescript ? `
import { PluginSDK } from '@mnbara/plugin-sdk';
import { main } from '../src/index';

// Mock the plugin SDK
jest.mock('@mnbara/plugin-sdk');

describe('${pluginName} Plugin', () => {
  let mockPlugin: jest.Mocked<PluginSDK>;

  beforeEach(() => {
    mockPlugin = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getContext: jest.fn().mockReturnValue({
        log: jest.fn(),
        metadata: {
          id: '${pluginName.toLowerCase().replace(/\s+/g, '-')}',
          name: '${pluginName}',
          version: '1.0.0'
        }
      })
    } as any;

    (PluginSDK as jest.MockedClass<typeof PluginSDK>).mockImplementation(() => mockPlugin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize successfully', async () => {
    await main();
    
    expect(mockPlugin.initialize).toHaveBeenCalled();
    expect(mockPlugin.getContext).toHaveBeenCalled();
  });

  test('should log plugin startup', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    await main();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('${pluginName} plugin started'));
    
    consoleSpy.mockRestore();
  });
});
` : `
const { PluginSDK } = require('@mnbara/plugin-sdk');
const { main } = require('../src/index');

// Mock the plugin SDK
jest.mock('@mnbara/plugin-sdk');

describe('${pluginName} Plugin', () => {
  let mockPlugin;

  beforeEach(() => {
    mockPlugin = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getContext: jest.fn().mockReturnValue({
        log: jest.fn(),
        metadata: {
          id: '${pluginName.toLowerCase().replace(/\s+/g, '-')}',
          name: '${pluginName}',
          version: '1.0.0'
        }
      })
    };

    PluginSDK.mockImplementation(() => mockPlugin);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize successfully', async () => {
    await main();
    
    expect(mockPlugin.initialize).toHaveBeenCalled();
    expect(mockPlugin.getContext).toHaveBeenCalled();
  });

  test('should log plugin startup', async () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    await main();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('${pluginName} plugin started'));
    
    consoleSpy.mockRestore();
  });
});
`;

    fs.writeFileSync(
      path.join(testDir, `plugin.test.${fileExtension}`),
      testContent.trim()
    );

    // Jest configuration
    const jestConfig = {
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: [
        '**/__tests__/**/*.+(ts|tsx|js)',
        '**/?(*.)+(spec|test).+(ts|tsx|js)'
      ],
      transform: features.typescript ? {
        '^.+\\.(ts|tsx)$': 'ts-jest'
      } : undefined,
      collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts'
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
    
    const readmeContent = `# ${pluginName}

${description}

## Features

${features.typescript ? '- ✅ TypeScript support' : '- ❌ TypeScript support'}
${features.hooks ? '- ✅ Hook system integration' : '- ❌ Hook system integration'}
${features.walletIntegration ? '- ✅ Wallet integration' : '- ❌ Wallet integration'}
${features.uiComponents ? '- ✅ UI components' : '- ❌ UI components'}
${features.apiEndpoints ? '- ✅ API endpoints' : '- ❌ API endpoints'}
${features.configuration ? '- ✅ Configuration management' : '- ❌ Configuration management'}

## Installation

\`\`\`bash
npm install
\`\`\`

## Development

${features.typescript ? `
### TypeScript Development

\`\`\`bash
# Build the plugin
npm run build

# Watch for changes
npm run dev
\`\`\`
` : `
### JavaScript Development

\`\`\`bash
# Start development mode
npm run dev
\`\`\`
`}

### Testing

\`\`\`bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
\`\`\`

### Code Quality

\`\`\`bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
\`\`\`

## Usage

This plugin can be integrated into the MNBara platform by:

1. Building the plugin: \`npm run build\`
2. Installing it through the MNBara plugin manager
3. Configuring it through the plugin configuration interface

## Configuration

${features.configuration ? `
The plugin can be configured through the \`config.json\` file:

\`\`\`json
{
  "settings": {
    "debug": false,
    "timeout": 30000,
    "retries": 3
  }
}
\`\`\`
` : 'This plugin does not require additional configuration.'}

## API Endpoints

${features.apiEndpoints ? `
The plugin exposes the following API endpoints:

- \`GET /api/hello\` - Returns a hello message
- \`GET /api/health\` - Returns health status
` : 'This plugin does not expose any API endpoints.'}

## Hooks

${features.hooks ? `
The plugin supports the following hooks:

- \`onInstall\` - Called when the plugin is installed
- \`onEnable\` - Called when the plugin is enabled
- \`onDisable\` - Called when the plugin is disabled
- \`onUninstall\` - Called when the plugin is uninstalled
${features.walletIntegration ? `
- \`onWalletConnect\` - Called when a wallet is connected
- \`onWalletDisconnect\` - Called when a wallet is disconnected
` : ''}
` : 'This plugin does not support hooks.'}

## Wallet Integration

${features.walletIntegration ? `
The plugin integrates with the MNBara wallet system and supports:

- Wallet connection/disconnection
- Balance queries
- Transaction sending
- Message signing

Supported chains: Ethereum, Polygon
` : 'This plugin does not integrate with wallets.'}

## UI Components

${features.uiComponents ? `
The plugin provides the following UI components:

- \`MainComponent\` - Main plugin interface
` : 'This plugin does not provide UI components.'}

## Author

${author}

## Version

${version}

## License

MIT

## Support

For support, please contact the plugin author or create an issue in the plugin repository.
`;

    fs.writeFileSync(
      path.join(pluginDir, 'README.md'),
      readmeContent
    );
  }

  private async generateBuildConfig(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    if (!features.typescript) return;

    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020', 'DOM'],
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
        emitDecoratorMetadata: true
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

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port
`;

    fs.writeFileSync(
      path.join(pluginDir, '.gitignore'),
      gitignoreContent
    );
  }

  private async generateESLintConfig(pluginDir: string): Promise<void> {
    const { features } = this.options;
    
    const eslintConfig = {
      env: {
        browser: true,
        es2021: true,
        node: true,
        jest: true
      },
      extends: [
        'eslint:recommended',
        ...(features.typescript ? ['@typescript-eslint/recommended'] : [])
      ],
      parser: features.typescript ? '@typescript-eslint/parser' : undefined,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: features.typescript ? ['@typescript-eslint'] : [],
      rules: {
        'no-console': 'warn',
        'no-unused-vars': 'error',
        'prefer-const': 'error',
        'no-var': 'error'
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
      printWidth: 80,
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
}

/**
 * Convenience function to generate a plugin template
 */
export async function generatePluginTemplate(options: PluginTemplateOptions): Promise<void> {
  const generator = new PluginTemplateGenerator(options);
  await generator.generate();
}