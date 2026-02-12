import * as fs from 'fs';
import * as path from 'path';

/**
 * Plugin Developer Tools Index
 * Exports all developer tools for plugin development
 */

export { PluginDevServer } from './PluginDevServer';
export { PluginCodeGenerator } from './PluginCodeGenerator';
export { PluginTemplateManager } from './PluginTemplateManager';
export { PluginDocumentationGenerator } from './PluginDocumentationGenerator';

/**
 * Plugin Developer Tools Manager
 * Central manager for all plugin development tools
 */
export class PluginDeveloperTools {
  private server: PluginDevServer | null = null;
  private generator: PluginCodeGenerator;
  private templateManager: PluginTemplateManager;
  private documentationGenerator: PluginDocumentationGenerator | null = null;

  constructor(private pluginPath: string) {
    this.generator = new PluginCodeGenerator();
    this.templateManager = new PluginTemplateManager();
  }

  /**
   * Start development server
   */
  async startDevServer(port = 3000): Promise<void> {
    if (this.server) {
      console.log('🔄 Development server is already running');
      return;
    }

    const { PluginDevServer } = await import('./PluginDevServer');
    this.server = new PluginDevServer(this.pluginPath, port);
    await this.server.start();
  }

  /**
   * Stop development server
   */
  async stopDevServer(): Promise<void> {
    if (this.server) {
      await this.server.stop();
      this.server = null;
    }
  }

  /**
   * Generate plugin code from template
   */
  async generatePlugin(options: GeneratePluginOptions): Promise<void> {
    const files = await this.generator.generate({
      name: options.name,
      template: options.template,
      description: options.description,
      author: options.author,
      version: options.version,
      type: options.type,
      config: options.config,
      hooks: options.hooks,
      permissions: options.permissions
    });

    // Write files to disk
    const outputPath = options.outputPath || path.join(process.cwd(), options.name);
    
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(outputPath, filename);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content);
    }

    console.log(`✅ Plugin generated: ${outputPath}`);
  }

  /**
   * Create plugin from template
   */
  async createPlugin(options: CreatePluginOptions): Promise<void> {
    await this.templateManager.createPlugin({
      name: options.name,
      template: options.template,
      outputDir: options.outputPath,
      description: options.description,
      author: options.author,
      version: options.version
    });
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(outputDir = 'docs'): Promise<void> {
    const { PluginDocumentationGenerator } = await import('./PluginDocumentationGenerator');
    this.documentationGenerator = new PluginDocumentationGenerator(this.pluginPath, outputDir);
    await this.documentationGenerator.generateAll();
  }

  /**
   * List available templates
   */
  listTemplates(): string[] {
    return this.templateManager.listTemplates().map(template => template.name);
  }

  /**
   * Get template information
   */
  getTemplateInfo(templateName: string): any {
    return this.templateManager.getTemplate(templateName);
  }

  /**
   * Get development server status
   */
  getDevServerStatus(): any {
    return this.server ? this.server.getStatus() : { running: false };
  }

  /**
   * Build plugin for production
   */
  async buildPlugin(): Promise<void> {
    const { execSync } = await import('child_process');
    
    console.log('🔨 Building plugin...');
    
    try {
      execSync('npm run build', { 
        cwd: this.pluginPath,
        stdio: 'inherit' 
      });
      console.log('✅ Plugin built successfully');
    } catch (error) {
      console.error('❌ Build failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Run plugin tests
   */
  async runTests(testPattern?: string): Promise<void> {
    const { execSync } = await import('child_process');
    
    console.log('🧪 Running tests...');
    
    try {
      const command = testPattern ? `npm test -- ${testPattern}` : 'npm test';
      execSync(command, { 
        cwd: this.pluginPath,
        stdio: 'inherit' 
      });
      console.log('✅ All tests passed');
    } catch (error) {
      console.error('❌ Tests failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Package plugin for distribution
   */
  async packagePlugin(outputFile = 'plugin-package.zip'): Promise<void> {
    const { execSync } = await import('child_process');
    
    console.log('📦 Packaging plugin...');
    
    // Build first
    await this.buildPlugin();
    
    try {
      // Create package
      const packagePath = path.join(this.pluginPath, outputFile);
      execSync(`zip -r "${packagePath}" dist/ manifest.json README.md package.json`, { 
        cwd: this.pluginPath,
        stdio: 'inherit' 
      });
      console.log(`✅ Plugin packaged: ${outputFile}`);
    } catch (error) {
      console.error('❌ Packaging failed:', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  /**
   * Validate plugin structure
   */
  validatePlugin(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check manifest.json
    const manifestPath = path.join(this.pluginPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      errors.push('manifest.json not found');
    } else {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        // Validate required fields
        const requiredFields = ['name', 'version', 'main', 'type'];
        for (const field of requiredFields) {
          if (!manifest[field]) {
            errors.push(`Missing required field in manifest: ${field}`);
          }
        }
      } catch (error) {
        errors.push('Invalid manifest.json format');
      }
    }

    // Check package.json
    const packageJsonPath = path.join(this.pluginPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      errors.push('package.json not found');
    }

    // Check main entry point
    const mainFile = path.join(this.pluginPath, 'index.js');
    const mainFileTs = path.join(this.pluginPath, 'index.ts');
    if (!fs.existsSync(mainFile) && !fs.existsSync(mainFileTs)) {
      errors.push('Main entry point not found (index.js or index.ts)');
    }

    // Check README
    const readmePath = path.join(this.pluginPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      warnings.push('README.md not found (recommended)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get plugin information
   */
  getPluginInfo(): any {
    const manifestPath = path.join(this.pluginPath, 'manifest.json');
    
    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    return {
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      type: manifest.type,
      main: manifest.main
    };
  }
}

/**
 * Generate plugin options
 */
interface GeneratePluginOptions {
  name: string;
  template: string;
  description?: string;
  author?: string;
  version?: string;
  type?: string;
  config?: Record<string, any>;
  hooks?: Record<string, string>;
  permissions?: string[];
  outputPath?: string;
}

/**
 * Create plugin options
 */
interface CreatePluginOptions {
  name: string;
  template: string;
  outputPath?: string;
  description?: string;
  author?: string;
  version?: string;
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}