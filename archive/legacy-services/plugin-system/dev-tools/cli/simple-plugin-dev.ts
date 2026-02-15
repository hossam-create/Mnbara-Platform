#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Simple Plugin Development CLI
 * Command-line interface for plugin development and scaffolding
 */
class SimplePluginDevCLI {
  private templatesDir: string;
  private currentDir: string;

  constructor() {
    this.templatesDir = path.join(__dirname, '..', 'templates');
    this.currentDir = process.cwd();
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
        case 'list-templates':
          await this.listTemplates();
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error(`❌ Error:`, error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
🛠️  Plugin Development CLI

Usage: plugin-dev <command> [options]

Commands:
  create <name> --template <template>  Create a new plugin from template
  list-templates                        List available templates
  help                                  Show this help message

Examples:
  plugin-dev create my-plugin --template live-streaming
  plugin-dev create my-marketplace --template marketplace
  plugin-dev list-templates
`);
  }

  /**
   * Create a new plugin from template
   */
  private async createPlugin(args: string[]): Promise<void> {
    const nameIndex = args.indexOf('--template');
    if (nameIndex === -1 || nameIndex === 0) {
      console.error('❌ Please specify a plugin name and template');
      console.log('Usage: plugin-dev create <name> --template <template>');
      return;
    }

    const pluginName = args[nameIndex - 1];
    const templateName = args[nameIndex + 1];

    if (!pluginName || !templateName) {
      console.error('❌ Please specify both plugin name and template');
      console.log('Usage: plugin-dev create <name> --template <template>');
      return;
    }

    console.log(`🚀 Creating plugin: ${pluginName} using template: ${templateName}`);

    // Get template path
    const templatePath = path.join(this.templatesDir, templateName);
    
    if (!fs.existsSync(templatePath)) {
      console.error(`❌ Template not found: ${templateName}`);
      console.log('Available templates:');
      await this.listTemplates();
      return;
    }

    // Create output directory
    const pluginPath = path.join(this.currentDir, pluginName);
    
    if (fs.existsSync(pluginPath)) {
      console.error(`❌ Plugin directory already exists: ${pluginName}`);
      return;
    }

    fs.mkdirSync(pluginPath, { recursive: true });

    // Copy template files
    await this.copyTemplateFiles(templatePath, pluginPath, {
      pluginName,
      templateName,
      author: 'Your Name',
      description: `A ${templateName} plugin`
    });

    console.log(`✅ Plugin created successfully: ${pluginName}`);
    console.log(`📁 Location: ${pluginPath}`);
    console.log(`\nNext steps:`);
    console.log(`  cd ${pluginName}`);
    console.log(`  npm install`);
    console.log(`  npm run build`);
  }

  /**
   * List available templates
   */
  private async listTemplates(): Promise<void> {
    console.log('📋 Available templates:');
    
    if (!fs.existsSync(this.templatesDir)) {
      console.log('❌ No templates directory found');
      return;
    }

    const templates = fs.readdirSync(this.templatesDir)
      .filter(item => fs.statSync(path.join(this.templatesDir, item)).isDirectory());

    if (templates.length === 0) {
      console.log('❌ No templates available');
      return;
    }

    templates.forEach(template => {
      const templatePath = path.join(this.templatesDir, template);
      const readmePath = path.join(templatePath, 'README.md');
      
      let description = 'No description available';
      if (fs.existsSync(readmePath)) {
        const readme = fs.readFileSync(readmePath, 'utf8');
        const firstLine = readme.split('\n')[0];
        if (firstLine.startsWith('# ')) {
          description = firstLine.substring(2);
        }
      }
      
      console.log(`  • ${template.padEnd(20)} - ${description}`);
    });
  }

  /**
   * Copy template files to destination
   */
  private async copyTemplateFiles(src: string, dest: string, options: any): Promise<void> {
    const items = fs.readdirSync(src);
    
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      
      if (fs.statSync(srcPath).isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await this.copyTemplateFiles(srcPath, destPath, options);
      } else {
        let content = fs.readFileSync(srcPath, 'utf8');
        
        // Process template variables
        content = this.processTemplateContent(content, options);
        
        fs.writeFileSync(destPath, content);
      }
    }
  }

  /**
   * Process template content (replace variables)
   */
  private processTemplateContent(content: string, options: any): string {
    const { pluginName, templateName, author, description } = options;
    
    // Replace template variables
    content = content.replace(/\{\{pluginName\}\}/g, pluginName);
    content = content.replace(/\{\{PluginName\}\}/g, this.toPascalCase(pluginName));
    content = content.replace(/\{\{templateName\}\}/g, templateName);
    content = content.replace(/\{\{author\}\}/g, author);
    content = content.replace(/\{\{description\}\}/g, description);
    content = content.replace(/\{\{currentDate\}\}/g, new Date().toISOString());
    
    return content;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
  }
}

// Run CLI
const cli = new SimplePluginDevCLI();
cli.run().catch(error => {
  console.error('❌ CLI Error:', error);
  process.exit(1);
});