import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Plugin Template Manager
 * Manages plugin templates and scaffolding
 */
export class PluginTemplateManager {
  private templatesDir: string;

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '..', 'templates');
    this.ensureTemplatesDir();
  }

  /**
   * Create a new plugin from template
   */
  async createPlugin(options: CreatePluginOptions): Promise<void> {
    const { name, template, outputDir } = options;
    
    console.log(`🚀 Creating plugin: ${name} using template: ${template}`);

    // Get template path
    const templatePath = path.join(this.templatesDir, template);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${template}`);
    }

    // Create output directory
    const pluginPath = path.join(outputDir || process.cwd(), name);
    
    if (fs.existsSync(pluginPath)) {
      throw new Error(`Plugin directory already exists: ${name}`);
    }

    fs.mkdirSync(pluginPath, { recursive: true });

    // Copy template files
    await this.copyTemplateFiles(templatePath, pluginPath, options);

    // Process template files
    await this.processTemplateFiles(pluginPath, options);

    // Install dependencies
    await this.installDependencies(pluginPath);

    console.log(`✅ Plugin created successfully: ${name}`);
    console.log(`📁 Location: ${pluginPath}`);
  }

  /**
   * List available templates
   */
  listTemplates(): Template[] {
    if (!fs.existsSync(this.templatesDir)) {
      return [];
    }

    const templates: Template[] = [];
    const templateDirs = fs.readdirSync(this.templatesDir);

    for (const templateDir of templateDirs) {
      const templatePath = path.join(this.templatesDir, templateDir);
      
      if (fs.statSync(templatePath).isDirectory()) {
        const template = this.loadTemplate(templatePath);
        if (template) {
          templates.push(template);
        }
      }
    }

    return templates;
  }

  /**
   * Get template details
   */
  getTemplate(templateName: string): Template | null {
    const templatePath = path.join(this.templatesDir, templateName);
    
    if (!fs.existsSync(templatePath)) {
      return null;
    }

    return this.loadTemplate(templatePath);
  }

  /**
   * Create a new template
   */
  async createTemplate(options: CreateTemplateOptions): Promise<void> {
    const { name, description, type, files } = options;
    
    console.log(`📝 Creating template: ${name}`);

    const templatePath = path.join(this.templatesDir, name);
    
    if (fs.existsSync(templatePath)) {
      throw new Error(`Template already exists: ${name}`);
    }

    fs.mkdirSync(templatePath, { recursive: true });

    // Create template.json
    const templateJson = {
      name,
      description,
      type,
      created: new Date().toISOString(),
      files: Object.keys(files)
    };

    fs.writeFileSync(
      path.join(templatePath, 'template.json'),
      JSON.stringify(templateJson, null, 2)
    );

    // Create template files
    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(templatePath, filename);
      const dir = path.dirname(filePath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content);
    }

    console.log(`✅ Template created: ${name}`);
  }

  /**
   * Update template
   */
  async updateTemplate(templateName: string, updates: Partial<Template>): Promise<void> {
    const templatePath = path.join(this.templatesDir, templateName);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const templateJsonPath = path.join(templatePath, 'template.json');
    const currentTemplate = JSON.parse(fs.readFileSync(templateJsonPath, 'utf8'));
    
    const updatedTemplate = {
      ...currentTemplate,
      ...updates,
      updated: new Date().toISOString()
    };

    fs.writeFileSync(
      templateJsonPath,
      JSON.stringify(updatedTemplate, null, 2)
    );

    console.log(`✅ Template updated: ${templateName}`);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateName: string): Promise<void> {
    const templatePath = path.join(this.templatesDir, templateName);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName}`);
    }

    // Confirm deletion
    console.log(`⚠️  Are you sure you want to delete template: ${templateName}?`);
    console.log('This action cannot be undone.');
    
    // In a real implementation, you might want to prompt for confirmation
    // For now, we'll proceed with deletion

    fs.rmSync(templatePath, { recursive: true, force: true });
    
    console.log(`✅ Template deleted: ${templateName}`);
  }

  /**
   * Copy template files
   */
  private async copyTemplateFiles(templatePath: string, pluginPath: string, options: CreatePluginOptions): Promise<void> {
    const files = fs.readdirSync(templatePath);

    for (const file of files) {
      const srcPath = path.join(templatePath, file);
      const destPath = path.join(pluginPath, file);

      if (file === 'template.json') {
        continue; // Skip template metadata
      }

      if (fs.statSync(srcPath).isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await this.copyTemplateFiles(srcPath, destPath, options);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Process template files (replace placeholders)
   */
  private async processTemplateFiles(pluginPath: string, options: CreatePluginOptions): Promise<void> {
    const files = this.getAllFiles(pluginPath);

    for (const file of files) {
      if (this.isTextFile(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        // Replace placeholders
        content = this.replacePlaceholders(content, options);
        
        fs.writeFileSync(file, content);
      }
    }
  }

  /**
   * Install dependencies
   */
  private async installDependencies(pluginPath: string): Promise<void> {
    console.log('📦 Installing dependencies...');

    try {
      execSync('npm install', { 
        cwd: pluginPath,
        stdio: 'inherit' 
      });
      console.log('✅ Dependencies installed');
    } catch (error) {
      console.warn('⚠️  npm install failed, you may need to install dependencies manually');
    }
  }

  /**
   * Load template
   */
  private loadTemplate(templatePath: string): Template | null {
    const templateJsonPath = path.join(templatePath, 'template.json');
    
    if (!fs.existsSync(templateJsonPath)) {
      return null;
    }

    const templateJson = JSON.parse(fs.readFileSync(templateJsonPath, 'utf8'));
    
    return {
      ...templateJson,
      path: templatePath
    };
  }

  /**
   * Get all files in directory
   */
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        files.push(...this.getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  /**
   * Check if file is text file
   */
  private isTextFile(file: string): boolean {
    const textExtensions = [
      '.js', '.ts', '.json', '.md', '.txt', '.html', '.css', '.scss', '.less',
      '.yml', '.yaml', '.xml', '.svg', '.vue', '.jsx', '.tsx'
    ];
    
    const ext = path.extname(file).toLowerCase();
    return textExtensions.includes(ext);
  }

  /**
   * Replace placeholders in content
   */
  private replacePlaceholders(content: string, options: CreatePluginOptions): string {
    const placeholders = {
      '{{pluginName}}': options.name,
      '{{PluginName}}': this.toPascalCase(options.name),
      '{{PLUGIN_NAME}}': options.name.toUpperCase().replace(/-/g, '_'),
      '{{description}}': options.description || '',
      '{{author}}': options.author || 'Your Name',
      '{{version}}': options.version || '1.0.0',
      '{{year}}': new Date().getFullYear().toString(),
      '{{date}}': new Date().toISOString().split('T')[0]
    };

    let result = content;
    
    for (const [placeholder, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return result;
  }

  /**
   * Ensure templates directory exists
   */
  private ensureTemplatesDir() {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
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
}

/**
 * Create plugin options
 */
interface CreatePluginOptions {
  name: string;
  template: string;
  outputDir?: string;
  description?: string;
  author?: string;
  version?: string;
  type?: string;
  config?: Record<string, any>;
  hooks?: Record<string, string>;
  permissions?: string[];
  dependencies?: Record<string, string>;
}

/**
 * Create template options
 */
interface CreateTemplateOptions {
  name: string;
  description: string;
  type: string;
  files: Record<string, string>;
}

/**
 * Template interface
 */
interface Template {
  name: string;
  description: string;
  type: string;
  created: string;
  updated?: string;
  files: string[];
  path: string;
}