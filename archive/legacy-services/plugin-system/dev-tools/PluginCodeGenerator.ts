import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Plugin Code Generator
 * Generates boilerplate code for plugins
 */
export class PluginCodeGenerator {
  private templates: Map<string, Template> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Generate plugin code from template
   */
  async generate(options: GenerateOptions): Promise<GeneratedFiles> {
    const template = this.templates.get(options.template);
    
    if (!template) {
      throw new Error(`Unknown template: ${options.template}`);
    }

    console.log(`🚀 Generating plugin code using template: ${options.template}`);

    const files: GeneratedFiles = {};

    // Generate manifest
    files['manifest.json'] = this.generateManifest(options, template);

    // Generate main plugin file
    files[options.mainFile || 'index.ts'] = this.generateMainFile(options, template);

    // Generate package.json
    files['package.json'] = this.generatePackageJson(options, template);

    // Generate README
    files['README.md'] = this.generateReadme(options, template);

    // Generate additional files based on template
    if (template.files) {
      for (const [filename, generator] of Object.entries(template.files)) {
        files[filename] = generator(options);
      }
    }

    console.log(`✅ Generated ${Object.keys(files).length} files`);
    
    return files;
  }

  /**
   * Generate plugin manifest
   */
  private generateManifest(options: GenerateOptions, template: Template): string {
    const manifest: any = {
      name: options.name,
      version: options.version || '1.0.0',
      description: options.description || template.description,
      author: options.author || 'Your Name',
      type: options.type || template.type,
      main: options.mainFile || 'index.ts',
      engines: {
        node: '>=14.0.0'
      },
      permissions: options.permissions || template.permissions || [],
      config: options.config || template.config || {},
      hooks: options.hooks || template.hooks || {},
      dependencies: options.dependencies || template.dependencies || {}
    };

    if (options.repository) {
      manifest.repository = options.repository;
    }

    if (options.bugs) {
      manifest.bugs = options.bugs;
    }

    if (options.homepage) {
      manifest.homepage = options.homepage;
    }

    return JSON.stringify(manifest, null, 2);
  }

  /**
   * Generate main plugin file
   */
  private generateMainFile(options: GenerateOptions, template: Template): string {
    const pluginName = this.toPascalCase(options.name);
    const className = `${pluginName}Plugin`;

    let content = '';

    // Add imports
    if (template.imports) {
      content += template.imports.join('\n') + '\n\n';
    }

    // Add class definition
    content += template.classTemplate
      .replace(/{{className}}/g, className)
      .replace(/{{pluginName}}/g, options.name)
      .replace(/{{description}}/g, options.description || template.description)
      .replace(/{{hooks}}/g, this.generateHooks(options.hooks || template.hooks || {}))
      .replace(/{{methods}}/g, this.generateMethods(options.methods || template.methods || []))
      .replace(/{{config}}/g, this.generateConfig(options.config || template.config || {}));

    return content;
  }

  /**
   * Generate package.json
   */
  private generatePackageJson(options: GenerateOptions, template: Template): string {
    const packageJson: any = {
      name: options.name,
      version: options.version || '1.0.0',
      description: options.description || template.description,
      main: options.mainFile || 'index.ts',
      scripts: {
        build: 'tsc',
        dev: 'ts-node index.ts',
        test: 'jest',
        lint: 'eslint . --ext .ts',
        'lint:fix': 'eslint . --ext .ts --fix',
        package: 'npm run build && zip -r plugin.zip dist/ manifest.json README.md package.json',
        ...options.scripts
      },
      keywords: options.keywords || template.keywords || ['plugin', 'mnbara'],
      author: options.author || 'Your Name',
      license: options.license || 'MIT',
      dependencies: {
        '@mnbara/plugin-core': '^1.0.0',
        ...template.dependencies,
        ...options.dependencies
      },
      devDependencies: {
        '@types/node': '^18.0.0',
        '@typescript-eslint/eslint-plugin': '^5.0.0',
        '@typescript-eslint/parser': '^5.0.0',
        'eslint': '^8.0.0',
        'jest': '^29.0.0',
        '@types/jest': '^29.0.0',
        'ts-jest': '^29.0.0',
        'typescript': '^4.9.0',
        'ts-node': '^10.0.0',
        ...options.devDependencies
      }
    };

    if (options.repository) {
      packageJson.repository = options.repository;
    }

    if (options.bugs) {
      packageJson.bugs = options.bugs;
    }

    if (options.homepage) {
      packageJson.homepage = options.homepage;
    }

    return JSON.stringify(packageJson, null, 2);
  }

  /**
   * Generate README
   */
  private generateReadme(options: GenerateOptions, template: Template): string {
    return `# ${options.name}

${options.description || template.description}

## Installation

\`\`\`bash
npm install ${options.name}
\`\`\`

## Usage

${template.usage || 'Add usage instructions here'}

## Configuration

${options.config || template.config ? 'This plugin supports configuration options.' : 'This plugin does not require configuration.'}

${options.config || template.config ? `\`\`\`json
{
  ${Object.entries(options.config || template.config || {}).map(([key, type]) => `"${key}": ${this.getExampleValue(type as string)}`).join(',\n  ')}
}
\`\`\`` : ''}

## Development

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
\`\`\`

## License

${options.license || 'MIT'}
`;
  }

  /**
   * Generate hooks
   */
  private generateHooks(hooks: Record<string, string>): string {
    if (Object.keys(hooks).length === 0) {
      return '';
    }

    return Object.entries(hooks)
      .map(([hook, handler]) => `  // Handle ${hook} hook
  async ${handler}(data: any): Promise<void> {
    console.log('${hook} hook triggered:', data);
    // Add your hook logic here
  }`)
      .join('\n\n');
  }

  /**
   * Generate methods
   */
  private generateMethods(methods: string[]): string {
    if (methods.length === 0) {
      return '';
    }

    return methods.map(method => {
      const [name, params = '', returnType = 'void'] = method.split(':');
      return `  // ${name} method
  async ${name}(${params}): Promise<${returnType}> {
    // Add your method logic here
    throw new Error('Method not implemented');
  }`;
    }).join('\n\n');
  }

  /**
   * Generate configuration
   */
  private generateConfig(config: Record<string, any>): string {
    if (Object.keys(config).length === 0) {
      return '{}';
    }

    return `{
${Object.entries(config).map(([key, type]) => `    ${key}: ${this.getTypeScriptType(type as string)}`).join(',\n')}
  }`;
  }

  /**
   * Get TypeScript type
   */
  private getTypeScriptType(type: string): string {
    switch (type) {
      case 'string': return '""';
      case 'number': return '0';
      case 'boolean': return 'false';
      case 'array': return '[]';
      case 'object': return '{}';
      default: return 'any';
    }
  }

  /**
   * Get example value
   */
  private getExampleValue(type: string): string {
    switch (type) {
      case 'string': return '"example"';
      case 'number': return '42';
      case 'boolean': return 'true';
      case 'array': return '[]';
      case 'object': return '{}';
      default: return '"example"';
    }
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Initialize templates
   */
  private initializeTemplates() {
    // Basic template
    this.templates.set('basic', {
      name: 'Basic Plugin',
      description: 'A basic plugin template',
      type: 'custom',
      classTemplate: `export class {{className}} {
  private config: any;
  private isInitialized = false;

  constructor(config: any = {}) {
    this.config = config;
  }

  async init(): Promise<void> {
    console.log('Initializing {{pluginName}} plugin');
    this.isInitialized = true;
  }

  async destroy(): Promise<void> {
    console.log('Destroying {{pluginName}} plugin');
    this.isInitialized = false;
  }

  async configure(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
    console.log('{{pluginName}} plugin configured:', this.config);
  }

  isReady(): boolean {
    return this.isInitialized;
  }

{{hooks}}

{{methods}}
}`,
      permissions: ['read', 'write'],
      config: {
        apiKey: 'string',
        endpoint: 'string',
        timeout: 'number'
      },
      hooks: {
        onAppStartup: 'onAppStartup',
        onUserLogin: 'onUserLogin'
      },
      methods: ['getData', 'setData:data:any:void'],
      dependencies: {},
      keywords: ['basic', 'plugin'],
      usage: 'This is a basic plugin template that provides essential functionality.'
    });

    // UI template
    this.templates.set('ui', {
      name: 'UI Plugin',
      description: 'A UI-focused plugin template',
      type: 'ui',
      classTemplate: `export class {{className}} {
  private config: any;
  private container: HTMLElement | null = null;
  private isInitialized = false;

  constructor(config: any = {}) {
    this.config = config;
  }

  async init(): Promise<void> {
    console.log('Initializing {{pluginName}} UI plugin');
    this.createContainer();
    this.isInitialized = true;
  }

  async destroy(): Promise<void> {
    console.log('Destroying {{pluginName}} UI plugin');
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.isInitialized = false;
  }

  private createContainer(): void {
    this.container = document.createElement('div');
    this.container.id = '{{pluginName}}-container';
    this.container.innerHTML = \`
      <div class="{{pluginName}}-header">
        <h2>{{pluginName}}</h2>
      </div>
      <div class="{{pluginName}}-content">
        <p>{{description}}</p>
      </div>
    \`;
    document.body.appendChild(this.container);
  }

  async configure(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
    console.log('{{pluginName}} plugin configured:', this.config);
  }

  isReady(): boolean {
    return this.isInitialized;
  }

{{hooks}}

{{methods}}
}`,
      permissions: ['dom', 'style'],
      config: {
        theme: 'string',
        position: 'string',
        width: 'number',
        height: 'number'
      },
      hooks: {
        onAppStartup: 'onAppStartup',
        onUserLogin: 'onUserLogin'
      },
      methods: ['show', 'hide', 'updateContent:content:string:void'],
      dependencies: {},
      keywords: ['ui', 'plugin', 'frontend'],
      usage: 'This template creates a UI plugin that can render components in the browser.'
    });

    // Analytics template
    this.templates.set('analytics', {
      name: 'Analytics Plugin',
      description: 'An analytics plugin template',
      type: 'analytics',
      classTemplate: `export class {{className}} {
  private config: any;
  private events: any[] = [];
  private isInitialized = false;

  constructor(config: any = {}) {
    this.config = config;
  }

  async init(): Promise<void> {
    console.log('Initializing {{pluginName}} analytics plugin');
    this.setupEventListeners();
    this.isInitialized = true;
  }

  async destroy(): Promise<void> {
    console.log('Destroying {{pluginName}} analytics plugin');
    this.events = [];
    this.isInitialized = false;
  }

  private setupEventListeners(): void {
    // Setup event listeners for analytics
    console.log('Setting up event listeners');
  }

  async trackEvent(eventName: string, properties: any = {}): Promise<void> {
    const event = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      userId: this.config.userId
    };
    
    this.events.push(event);
    console.log('Event tracked:', event);
  }

  async configure(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
    console.log('{{pluginName}} plugin configured:', this.config);
  }

  getEvents(): any[] {
    return this.events;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

{{hooks}}

{{methods}}
}`,
      permissions: ['read', 'write', 'network'],
      config: {
        apiKey: 'string',
        endpoint: 'string',
        userId: 'string',
        sessionId: 'string'
      },
      hooks: {
        onAppStartup: 'onAppStartup',
        onUserLogin: 'onUserLogin',
        onUserLogout: 'onUserLogout'
      },
      methods: ['trackEvent:eventName:string,properties:any:void', 'getEvents', 'flushEvents'],
      dependencies: {},
      keywords: ['analytics', 'tracking', 'plugin'],
      usage: 'This template creates an analytics plugin for tracking user events and behavior.'
    });

    // Integration template
    this.templates.set('integration', {
      name: 'Integration Plugin',
      description: 'An integration plugin template',
      type: 'integration',
      classTemplate: `export class {{className}} {
  private config: any;
  private client: any;
  private isInitialized = false;

  constructor(config: any = {}) {
    this.config = config;
  }

  async init(): Promise<void> {
    console.log('Initializing {{pluginName}} integration plugin');
    await this.setupClient();
    this.isInitialized = true;
  }

  async destroy(): Promise<void> {
    console.log('Destroying {{pluginName}} integration plugin');
    if (this.client) {
      await this.disconnect();
    }
    this.isInitialized = false;
  }

  private async setupClient(): Promise<void> {
    // Setup integration client
    console.log('Setting up integration client');
  }

  private async disconnect(): Promise<void> {
    // Disconnect from integration
    console.log('Disconnecting from integration');
  }

  async configure(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
    console.log('{{pluginName}} plugin configured:', this.config);
    
    // Reinitialize with new config
    if (this.isInitialized) {
      await this.destroy();
      await this.init();
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

{{hooks}}

{{methods}}
}`,
      permissions: ['network', 'read', 'write'],
      config: {
        apiKey: 'string',
        endpoint: 'string',
        timeout: 'number',
        retryAttempts: 'number'
      },
      hooks: {
        onAppStartup: 'onAppStartup',
        onUserLogin: 'onUserLogin'
      },
      methods: ['connect', 'disconnect', 'sendData:data:any:Promise<void>', 'receiveData:Promise<any>'],
      dependencies: {},
      keywords: ['integration', 'api', 'plugin'],
      usage: 'This template creates an integration plugin for connecting to external services.'
    });

    // Automation template
    this.templates.set('automation', {
      name: 'Automation Plugin',
      description: 'An automation plugin template',
      type: 'automation',
      classTemplate: `export class {{className}} {
  private config: any;
  private rules: any[] = [];
  private isInitialized = false;

  constructor(config: any = {}) {
    this.config = config;
  }

  async init(): Promise<void> {
    console.log('Initializing {{pluginName}} automation plugin');
    this.loadRules();
    this.isInitialized = true;
  }

  async destroy(): Promise<void> {
    console.log('Destroying {{pluginName}} automation plugin');
    this.rules = [];
    this.isInitialized = false;
  }

  private loadRules(): void {
    // Load automation rules
    console.log('Loading automation rules');
  }

  async addRule(rule: any): Promise<void> {
    this.rules.push(rule);
    console.log('Automation rule added:', rule);
  }

  async removeRule(ruleId: string): Promise<void> {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
    console.log('Automation rule removed:', ruleId);
  }

  async executeRule(ruleId: string, context: any): Promise<void> {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      console.log('Executing automation rule:', rule);
      // Execute rule logic
    }
  }

  async configure(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
    console.log('{{pluginName}} plugin configured:', this.config);
  }

  getRules(): any[] {
    return this.rules;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

{{hooks}}

{{methods}}
}`,
      permissions: ['read', 'write', 'execute'],
      config: {
        maxRules: 'number',
        executionTimeout: 'number',
        retryAttempts: 'number'
      },
      hooks: {
        onAppStartup: 'onAppStartup',
        onUserLogin: 'onUserLogin',
        onUserLogout: 'onUserLogout'
      },
      methods: ['addRule:rule:any:Promise<void>', 'removeRule:ruleId:string:Promise<void>', 'executeRule:ruleId:string,context:any:Promise<void>', 'getRules'],
      dependencies: {},
      keywords: ['automation', 'rules', 'plugin'],
      usage: 'This template creates an automation plugin for executing rules and workflows.'
    });
  }

  /**
   * Get available templates
   */
  getTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get template info
   */
  getTemplateInfo(templateName: string): Template | undefined {
    return this.templates.get(templateName);
  }
}

/**
 * Template interface
 */
interface Template {
  name: string;
  description: string;
  type: string;
  classTemplate: string;
  permissions: string[];
  config: Record<string, string>;
  hooks: Record<string, string>;
  methods: string[];
  dependencies: Record<string, string>;
  keywords: string[];
  usage: string;
  files?: Record<string, (options: GenerateOptions) => string>;
}

/**
 * Generate options
 */
interface GenerateOptions {
  name: string;
  template: string;
  version?: string;
  description?: string;
  author?: string;
  type?: string;
  mainFile?: string;
  permissions?: string[];
  config?: Record<string, any>;
  hooks?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  keywords?: string[];
  license?: string;
  repository?: {
    type: string;
    url: string;
  };
  bugs?: {
    url: string;
  };
  homepage?: string;
  methods?: string[];
}

/**
 * Generated files
 */
interface GeneratedFiles {
  [filename: string]: string;
}