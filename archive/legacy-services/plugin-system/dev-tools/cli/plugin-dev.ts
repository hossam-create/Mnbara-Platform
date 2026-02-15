#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { PluginDeveloperTools } from '../index';

/**
 * Enhanced Plugin Development CLI
 * Command-line interface for plugin development and scaffolding
 */
class PluginDevCLI {
  private templatesDir: string;
  private currentDir: string;
  private tools: PluginDeveloperTools;

  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.currentDir = process.cwd();
    this.tools = new PluginDeveloperTools(this.currentDir);
  }

  /**
   * Main CLI entry point
   */
  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];
    
    try {
      switch (command) {
        case 'create':
          await this.createPlugin(args.slice(1));
          break;
        case 'build':
          await this.buildPlugin(args.slice(1));
          break;
        case 'dev':
          await this.startDevServer(args.slice(1));
          break;
        case 'test':
          await this.runTests(args.slice(1));
          break;
        case 'package':
          await this.packagePlugin(args.slice(1));
          break;
        case 'publish':
          await this.publishPlugin(args.slice(1));
          break;
        case 'validate':
          await this.validatePlugin(args.slice(1));
          break;
        case 'docs':
          await this.generateDocs(args.slice(1));
          break;
        case 'lint':
          await this.lintPlugin(args.slice(1));
          break;
        case 'init':
          await this.initWorkspace(args.slice(1));
          break;
        case 'add-hook':
          await this.addHook(args.slice(1));
          break;
        case 'add-config':
          await this.addConfig(args.slice(1));
          break;
        case 'add-permission':
          await this.addPermission(args.slice(1));
          break;
        case 'list-templates':
          await this.listAvailableTemplates();
          break;
        case 'template-info':
          await this.showTemplateInfo(args.slice(1));
          break;
        case 'upgrade':
          await this.upgradePlugin(args.slice(1));
          break;
        case 'test':
          await this.testPlugin(args.slice(1));
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Create a new plugin from template
   */
  private async createPlugin(args: string[]) {
    const pluginName = args[0];
    const template = args[1] || 'basic';
    
    if (!pluginName) {
      console.error('Plugin name is required');
      process.exit(1);
    }

    console.log(`🚀 Creating plugin: ${pluginName} (template: ${template})`);

    const pluginDir = path.join(this.currentDir, pluginName);
    
    if (fs.existsSync(pluginDir)) {
      console.error(`❌ Directory already exists: ${pluginName}`);
      process.exit(1);
    }

    // Create plugin directory
    fs.mkdirSync(pluginDir, { recursive: true });

    // Generate plugin using the tools
    await this.tools.generatePlugin({
      name: pluginName,
      template,
      description: args[2] || `A ${template} plugin`,
      author: args[3] || 'Anonymous',
      version: '1.0.0',
      type: this.getPluginTypeFromTemplate(template),
      outputPath: pluginDir
    });

    // Install dependencies
    console.log('📦 Installing dependencies...');
    process.chdir(pluginDir);
    try {
      execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
      console.warn('⚠️  npm install failed, you may need to install dependencies manually');
    }

    console.log(`✅ Plugin created successfully: ${pluginName}`);
    console.log('\nNext steps:');
    console.log(`  cd ${pluginName}`);
    console.log('  npm run dev     # Start development server');
    console.log('  npm run build   # Build for production');
    console.log('  npm run test    # Run tests');
  }

  /**
   * Initialize plugin workspace
   */
  private async initWorkspace(args: string[]) {
    const workspacePath = args[0] || '.';
    const template = args[1] || 'workspace';

    console.log(`🏗️  Initializing plugin workspace: ${workspacePath}`);

    const fullPath = path.resolve(workspacePath);
    
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    // Create workspace configuration
    const workspaceConfig = {
      name: path.basename(fullPath),
      version: '1.0.0',
      type: 'workspace',
      plugins: [],
      sharedDependencies: {},
      buildConfig: {
        outputDir: 'dist',
        sourceDir: 'src',
        testDir: 'tests'
      }
    };

    fs.writeFileSync(
      path.join(fullPath, 'plugin-workspace.json'),
      JSON.stringify(workspaceConfig, null, 2)
    );

    // Create shared configuration files
    this.createSharedConfigs(fullPath);

    console.log('✅ Workspace initialized successfully');
    console.log('\nNext steps:');
    console.log('  plugin-dev create my-plugin  # Create a new plugin');
    console.log('  plugin-dev dev               # Start development server');
  }

  /**
   * Add hook to existing plugin
   */
  private async addHook(args: string[]) {
    const pluginPath = args[0] || '.';
    const hookName = args[1];
    const handlerName = args[2] || `on${this.toPascalCase(hookName)}`;

    if (!hookName) {
      console.error('Hook name is required');
      process.exit(1);
    }

    console.log(`➕ Adding hook: ${hookName} -> ${handlerName}`);

    const fullPath = path.resolve(pluginPath);
    const manifestPath = path.join(fullPath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      console.error('❌ manifest.json not found');
      process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (!manifest.hooks) {
      manifest.hooks = {};
    }

    manifest.hooks[hookName] = handlerName;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Add hook handler to main file
    await this.addHookHandler(fullPath, hookName, handlerName);

    console.log(`✅ Hook added: ${hookName}`);
  }

  /**
   * Add configuration option to plugin
   */
  private async addConfig(args: string[]) {
    const pluginPath = args[0] || '.';
    const configName = args[1];
    const configType = args[2] || 'string';
    const defaultValue = args[3];

    if (!configName) {
      console.error('Configuration name is required');
      process.exit(1);
    }

    console.log(`⚙️  Adding configuration: ${configName} (${configType})`);

    const fullPath = path.resolve(pluginPath);
    const manifestPath = path.join(fullPath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      console.error('❌ manifest.json not found');
      process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (!manifest.config) {
      manifest.config = {};
    }

    manifest.config[configName] = configType;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Add configuration to plugin code
    await this.addConfigOption(fullPath, configName, configType, defaultValue);

    console.log(`✅ Configuration added: ${configName}`);
  }

  /**
   * Add permission requirement to plugin
   */
  private async addPermission(args: string[]) {
    const pluginPath = args[0] || '.';
    const permission = args[1];

    if (!permission) {
      console.error('Permission is required');
      process.exit(1);
    }

    console.log(`🔐 Adding permission: ${permission}`);

    const fullPath = path.resolve(pluginPath);
    const manifestPath = path.join(fullPath, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
      console.error('❌ manifest.json not found');
      process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (!manifest.permissions) {
      manifest.permissions = [];
    }

    if (!manifest.permissions.includes(permission)) {
      manifest.permissions.push(permission);
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`✅ Permission added: ${permission}`);
  }

  /**
   * List available templates
   */
  private async listAvailableTemplates() {
    console.log('📋 Available templates:');
    
    const templates = [
      { name: 'basic', description: 'Basic plugin with minimal setup' },
      { name: 'ui', description: 'UI-focused plugin with component examples' },
      { name: 'analytics', description: 'Analytics plugin with data collection' },
      { name: 'integration', description: 'Integration plugin with external APIs' },
      { name: 'automation', description: 'Automation plugin with scheduled tasks' },
      { name: 'live-streaming', description: 'Live streaming plugin for eBay Live' },
      { name: 'marketplace', description: 'Marketplace plugin with product management' },
      { name: 'wallet', description: 'Wallet plugin with payment integration' }
    ];

    templates.forEach(template => {
      console.log(`  ${template.name.padEnd(15)} - ${template.description}`);
    });
  }

  /**
   * Show template information
   */
  private async showTemplateInfo(args: string[]) {
    const templateName = args[0];

    if (!templateName) {
      console.error('Template name is required');
      process.exit(1);
    }

    console.log(`📋 Template information: ${templateName}`);
    
    // This would typically read from template metadata
    const templateInfo = {
      basic: {
        description: 'Basic plugin template',
        features: ['Minimal setup', 'Hook examples', 'Configuration examples'],
        dependencies: ['@mnbara/plugin-core'],
        files: ['index.ts', 'manifest.json', 'package.json', 'README.md']
      },
      'live-streaming': {
        description: 'Live streaming plugin for eBay Live',
        features: ['Live stream integration', 'Real-time events', 'Chat functionality', 'Stream controls'],
        dependencies: ['@mnbara/plugin-core', '@mnbara/live-streaming'],
        files: ['index.ts', 'manifest.json', 'package.json', 'README.md', 'src/stream-handler.ts', 'src/chat-manager.ts']
      }
    };

    const info = templateInfo[templateName as keyof typeof templateInfo];
    
    if (!info) {
      console.error(`❌ Template not found: ${templateName}`);
      return;
    }

    console.log(`Description: ${info.description}`);
    console.log('\nFeatures:');
    info.features.forEach(feature => console.log(`  - ${feature}`));
    console.log('\nDependencies:');
    info.dependencies.forEach(dep => console.log(`  - ${dep}`));
    console.log('\nFiles:');
    info.files.forEach(file => console.log(`  - ${file}`));
  }

  /**
   * Upgrade plugin to latest version
   */
  private async upgradePlugin(args: string[]) {
    const pluginPath = args[0] || '.';
    const targetVersion = args[1] || 'latest';

    console.log(`⬆️  Upgrading plugin: ${pluginPath} to ${targetVersion}`);

    const fullPath = path.resolve(pluginPath);
    const packageJsonPath = path.join(fullPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json not found');
      process.exit(1);
    }

    // Update dependencies
    process.chdir(fullPath);
    try {
      execSync(`npm update @mnbara/plugin-core ${targetVersion === 'latest' ? '' : `@${targetVersion}`}`, { stdio: 'inherit' });
      console.log('✅ Plugin upgraded successfully');
    } catch (error) {
      console.error('❌ Upgrade failed');
      process.exit(1);
    }
  }

  /**
   * Run comprehensive plugin tests
   */
  private async testPlugin(args: string[]) {
    const pluginPath = args[0] || '.';
    const testType = args[1] || 'all';
    const snykToken = args[2] || process.env.SNYK_TOKEN;

    console.log(`🧪 Testing plugin: ${pluginPath} (type: ${testType})`);

    const fullPath = path.resolve(pluginPath);
    const packageJsonPath = path.join(fullPath, 'package.json');
    const manifestPath = path.join(fullPath, 'plugin.json');

    if (!fs.existsSync(packageJsonPath)) {
      console.error('❌ package.json not found');
      process.exit(1);
    }

    if (!fs.existsSync(manifestPath)) {
      console.error('❌ plugin.json not found');
      process.exit(1);
    }

    try {
      // Import testing framework
      const { PluginTestingFramework } = await import('../../testing/PluginTestingFramework');
      const { PluginManager } = await import('@mnbara/plugin-manager');
      const { HookSystem } = await import('@mnbara/hook-system');

      // Initialize testing framework
      const pluginManager = new PluginManager();
      const hookSystem = new HookSystem();
      const testingFramework = new PluginTestingFramework(pluginManager, hookSystem, snykToken);

      // Load plugin manifest
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Generate test suite based on test type
      const testSuite = testingFramework.generateTestSuite(manifest.name, {
        maxDependencies: 15,
        allowedPermissions: ['read', 'write', 'execute', 'stream:read', 'chat:read'],
        maxLoadTime: 3000,
        maxHookTime: 1000
      });

      // Run tests
      console.log(`\n📋 Running ${testType} tests...`);
      
      let results;
      if (testType === 'all') {
        results = await testingFramework.runPluginTests(manifest.name, testSuite);
      } else if (testType === 'security') {
        results = await testingFramework.runPluginTests(manifest.name, {
          ...testSuite,
          manifest: [],
          functional: [],
          performance: [],
          integration: [],
          hooks: []
        });
      } else if (testType === 'performance') {
        results = await testingFramework.runPluginTests(manifest.name, {
          ...testSuite,
          manifest: [],
          security: [],
          functional: [],
          integration: [],
          hooks: []
        });
      } else if (testType === 'functional') {
        results = await testingFramework.runPluginTests(manifest.name, {
          ...testSuite,
          manifest: [],
          security: [],
          performance: [],
          integration: [],
          hooks: []
        });
      } else {
        console.error(`❌ Unknown test type: ${testType}`);
        process.exit(1);
      }

      // Display results
      console.log(`\n📊 Test Results:`);
      console.log(`   Plugin: ${manifest.name}`);
      console.log(`   Version: ${manifest.version}`);
      console.log(`   Tests: ${results.summary.passed}/${results.summary.total} passed`);
      console.log(`   Duration: ${results.summary.duration}ms`);
      console.log(`   Coverage: ${this.calculateOverallCoverage(results.coverage)}%`);

      if (results.recommendations.length > 0) {
        console.log(`\n💡 Recommendations:`);
        results.recommendations.forEach(rec => console.log(`   - ${rec}`));
      }

      // Save test report
      const reportPath = path.join(fullPath, 'test-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
      console.log(`\n📄 Test report saved to: ${reportPath}`);

      // Exit with appropriate code
      if (results.summary.failed > 0) {
        console.log(`\n❌ ${results.summary.failed} tests failed`);
        process.exit(1);
      } else {
        console.log(`\n✅ All tests passed!`);
      }

    } catch (error) {
      console.error('❌ Test execution failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private calculateOverallCoverage(coverage: any): number {
    const categories = Object.keys(coverage);
    if (categories.length === 0) return 0;
    
    const totalPercentage = categories.reduce((sum, category) => {
      return sum + (coverage[category]?.percentage || 0);
    }, 0);
    
    return Math.round(totalPercentage / categories.length);
  }

  // ... (rest of the existing methods remain the same)

  /**
   * Helper methods
   */
  private getPluginTypeFromTemplate(template: string): string {
    const typeMap: Record<string, string> = {
      basic: 'custom',
      ui: 'ui',
      analytics: 'analytics',
      integration: 'integration',
      automation: 'automation',
      'live-streaming': 'custom',
      marketplace: 'custom',
      wallet: 'custom'
    };
    
    return typeMap[template] || 'custom';
  }

  private createSharedConfigs(workspacePath: string) {
    // Create shared ESLint config
    const eslintConfig = {
      env: {
        browser: true,
        es2021: true,
        node: true,
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
      ],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      plugins: [
        '@typescript-eslint',
      ],
      rules: {
        'no-console': 'warn',
        'no-unused-vars': 'error',
        '@typescript-eslint/no-unused-vars': 'error',
      },
    };

    fs.writeFileSync(
      path.join(workspacePath, '.eslintrc.json'),
      JSON.stringify(eslintConfig, null, 2)
    );

    // Create shared TypeScript config
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
        resolveJsonModule: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests']
    };

    fs.writeFileSync(
      path.join(workspacePath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
  }

  private async addHookHandler(pluginPath: string, hookName: string, handlerName: string) {
    const mainFile = path.join(pluginPath, 'index.ts');
    
    if (!fs.existsSync(mainFile)) {
      console.warn('⚠️  Main plugin file not found, hook handler not added');
      return;
    }

    let content = fs.readFileSync(mainFile, 'utf8');
    
    // Add hook handler method
    const hookHandler = `
  /**
   * Handle ${hookName} hook
   */
  async ${handlerName}(data: any): Promise<void> {
    console.log('${hookName} hook triggered:', data);
    // TODO: Implement ${handlerName} logic
  }
`;

    // Find the class and add the method
    const classMatch = content.match(/export class (\w+) implements Plugin/);
    if (classMatch) {
      const className = classMatch[1];
      const insertPoint = content.lastIndexOf('}');
      
      content = content.slice(0, insertPoint) + hookHandler + content.slice(insertPoint);
      fs.writeFileSync(mainFile, content);
    }
  }

  private async addConfigOption(pluginPath: string, configName: string, configType: string, defaultValue?: string) {
    const mainFile = path.join(pluginPath, 'index.ts');
    
    if (!fs.existsSync(mainFile)) {
      console.warn('⚠️  Main plugin file not found, config option not added');
      return;
    }

    let content = fs.readFileSync(mainFile, 'utf8');
    
    // Add config property
    const configProperty = `  ${configName}?: ${configType};\n`;
    
    // Find the interface and add the property
    const interfaceMatch = content.match(/interface (\w+)Config/);
    if (interfaceMatch) {
      const interfaceName = interfaceMatch[1];
      const interfaceEnd = content.indexOf('}', content.indexOf(`interface ${interfaceName}`));
      
      content = content.slice(0, interfaceEnd) + configProperty + content.slice(interfaceEnd);
      fs.writeFileSync(mainFile, content);
    }
  }

  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }

  /**
   * Show enhanced help
   */
  private showHelp() {
    console.log(`
🛠️  Plugin Development CLI - Enhanced Version

Usage: plugin-dev <command> [options]

Core Commands:
  create <name> [template]     Create a new plugin from template
  init [path] [template]       Initialize plugin workspace
  build [path] [output]        Build plugin for production
  dev [path] [port]             Start development server
  test [path] [type] [token]   Run plugin tests (types: all, security, performance, functional)
  package [path] [output]       Package plugin for distribution
  publish [path] [registry]     Publish plugin to marketplace
  validate [path]               Validate plugin structure
  docs [path] [output]         Generate documentation
  lint [path] [--fix]           Lint plugin code

Development Commands:
  add-hook <path> <name> [handler]     Add hook to plugin
  add-config <path> <name> [type] [default]  Add configuration option
  add-permission <path> <permission>   Add permission requirement
  upgrade [path] [version]             Upgrade plugin dependencies

Template Commands:
  list-templates               List available templates
  template-info <template>     Show template information

Utility Commands:
  help                         Show this help

Templates:
  basic              Basic plugin with minimal setup
  ui                 UI-focused plugin with component examples
  analytics          Analytics plugin with data collection
  integration        Integration plugin with external APIs
  automation         Automation plugin with scheduled tasks
  live-streaming     Live streaming plugin for eBay Live
  marketplace        Marketplace plugin with product management
  wallet             Wallet plugin with payment integration

Examples:
  plugin-dev create my-plugin basic
  plugin-dev init my-workspace
  plugin-dev add-hook ./my-plugin user-login onUserLogin
  plugin-dev add-config ./my-plugin apiKey string "your-api-key"
  plugin-dev dev ./my-plugin 3000
  plugin-dev test ./my-plugin all
  plugin-dev test ./my-plugin security
  plugin-dev package ./my-plugin
  plugin-dev publish ./my-plugin
  plugin-dev validate ./my-plugin
  plugin-dev docs ./my-plugin
  plugin-dev lint ./my-plugin --fix
  plugin-dev list-templates
  plugin-dev template-info live-streaming
`);
  }
}

// Run the CLI
const cli = new PluginDevCLI();
cli.run().catch(error => {
  console.error('CLI Error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});