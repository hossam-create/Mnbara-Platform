#!/usr/bin/env node

/**
 * MNBara Plugin Template Generator CLI
 * 
 * Command-line interface for generating plugin templates with best practices,
 * TypeScript support, and all necessary files for production-ready plugins.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PluginTemplateGenerator, PluginTemplateOptions } from './plugin-template-generator';

interface CLIOptions {
  name: string;
  id?: string;
  description?: string;
  author?: string;
  version?: string;
  type?: 'basic' | 'wallet-integration' | 'hook-provider' | 'ui-component' | 'api-service';
  typescript?: boolean;
  hooks?: boolean;
  wallet?: boolean;
  ui?: boolean;
  api?: boolean;
  config?: boolean;
  permissions?: string[];
  output?: string;
  help?: boolean;
}

function showHelp(): void {
  console.log(`
MNBara Plugin Template Generator

Usage: mnbara-plugin-template [options]

Options:
  --name <name>           Plugin name (required)
  --id <id>               Plugin ID (default: kebab-case of name)
  --description <desc>    Plugin description
  --author <author>       Plugin author (default: from git config or "Anonymous")
  --version <version>     Plugin version (default: 1.0.0)
  --type <type>           Plugin type: basic|wallet-integration|hook-provider|ui-component|api-service (default: basic)
  --typescript            Use TypeScript (default: true)
  --hooks                 Include hook system support
  --wallet                Include wallet integration
  --ui                    Include UI components
  --api                   Include API endpoints
  --config                Include configuration management (default: true)
  --permissions <perms>   Comma-separated permissions list
  --output <dir>          Output directory (default: ./<plugin-name>)
  --help                  Show this help message

Examples:
  # Basic plugin
  mnbara-plugin-template --name my-plugin --description "My custom plugin"

  # Wallet integration plugin with TypeScript
  mnbara-plugin-template --name wallet-tracker --type wallet-integration --typescript --wallet

  # Full-featured plugin
  mnbara-plugin-template --name super-plugin --type api-service --typescript --hooks --wallet --ui --api --config

  # Custom output directory
  mnbara-plugin-template --name my-plugin --output ./plugins/my-plugin
`);
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    name: '',
    version: '1.0.0',
    type: 'basic',
    typescript: true,
    config: true,
    output: '',
    permissions: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--name':
        options.name = nextArg;
        i++;
        break;
      case '--id':
        options.id = nextArg;
        i++;
        break;
      case '--description':
        options.description = nextArg;
        i++;
        break;
      case '--author':
        options.author = nextArg;
        i++;
        break;
      case '--version':
        options.version = nextArg;
        i++;
        break;
      case '--type':
        options.type = nextArg as CLIOptions['type'];
        i++;
        break;
      case '--typescript':
        options.typescript = true;
        break;
      case '--hooks':
        options.hooks = true;
        break;
      case '--wallet':
        options.wallet = true;
        break;
      case '--ui':
        options.ui = true;
        break;
      case '--api':
        options.api = true;
        break;
      case '--config':
        options.config = true;
        break;
      case '--no-typescript':
        options.typescript = false;
        break;
      case '--no-config':
        options.config = false;
        break;
      case '--permissions':
        if (nextArg) {
          options.permissions = nextArg.split(',').map(p => p.trim());
          i++;
        }
        break;
      case '--output':
        options.output = nextArg;
        i++;
        break;
      default:
        console.warn(`Unknown option: ${arg}`);
        break;
    }
  }

  return options;
}

function getDefaultAuthor(): string {
  try {
    // Try to get author from git config
    const { execSync } = require('child_process');
    const name = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
    return `${name} <${email}>`;
  } catch {
    // Fallback to environment or default
    return process.env.USER || process.env.USERNAME || 'Anonymous';
  }
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function validateOptions(options: CLIOptions): void {
  if (!options.name) {
    throw new Error('Plugin name is required. Use --name <name>');
  }

  if (options.name.includes(' ')) {
    throw new Error('Plugin name should not contain spaces. Use kebab-case or camelCase.');
  }

  if (!options.description) {
    console.warn('Warning: No description provided. Consider adding --description');
  }

  const validTypes = ['basic', 'wallet-integration', 'hook-provider', 'ui-component', 'api-service'];
  if (options.type && !validTypes.includes(options.type)) {
    throw new Error(`Invalid type: ${options.type}. Valid types: ${validTypes.join(', ')}`);
  }
}

function getDefaultPermissions(type: string): string[] {
  const permissions = ['plugins:read'];
  
  switch (type) {
    case 'wallet-integration':
      permissions.push('wallet:read', 'wallet:write', 'transactions:read');
      break;
    case 'hook-provider':
      permissions.push('hooks:register', 'hooks:trigger');
      break;
    case 'ui-component':
      permissions.push('ui:render', 'ui:modify');
      break;
    case 'api-service':
      permissions.push('api:register', 'api:access');
      break;
  }
  
  return permissions;
}

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
      showHelp();
      return;
    }

    const cliOptions = parseArgs(args);
    validateOptions(cliOptions);

    // Set defaults
    const pluginId = cliOptions.id || toKebabCase(cliOptions.name);
    const author = cliOptions.author || getDefaultAuthor();
    const outputDir = cliOptions.output || path.join(process.cwd(), toKebabCase(cliOptions.name));
    const permissions = cliOptions.permissions.length > 0 
      ? cliOptions.permissions 
      : getDefaultPermissions(cliOptions.type!);

    // Auto-enable features based on type
    let hooks = cliOptions.hooks || false;
    let wallet = cliOptions.wallet || false;
    let ui = cliOptions.ui || false;
    let api = cliOptions.api || false;

    switch (cliOptions.type) {
      case 'wallet-integration':
        wallet = true;
        hooks = true;
        break;
      case 'hook-provider':
        hooks = true;
        break;
      case 'ui-component':
        ui = true;
        hooks = true;
        break;
      case 'api-service':
        api = true;
        hooks = true;
        wallet = true;
        ui = true;
        break;
    }

    const templateOptions: PluginTemplateOptions = {
      pluginName: cliOptions.name,
      pluginId,
      description: cliOptions.description || `${this.toPascalCase(cliOptions.name)} plugin for MNBara`,
      author,
      version: cliOptions.version!,
      type: cliOptions.type!,
      features: {
        typescript: cliOptions.typescript!,
        hooks,
        walletIntegration: wallet,
        uiComponents: ui,
        apiEndpoints: api,
        configuration: cliOptions.config!,
        permissions
      },
      outputDirectory: outputDir
    };

    console.log('🚀 Generating plugin template...');
    console.log(`   Name: ${templateOptions.pluginName}`);
    console.log(`   ID: ${templateOptions.pluginId}`);
    console.log(`   Type: ${templateOptions.type}`);
    console.log(`   TypeScript: ${templateOptions.features.typescript ? 'Yes' : 'No'}`);
    console.log(`   Features: ${Object.entries(templateOptions.features)
      .filter(([key, value]) => value === true && key !== 'typescript')
      .map(([key]) => key)
      .join(', ')}`);
    console.log(`   Output: ${templateOptions.outputDirectory}`);
    console.log('');

    const generator = new PluginTemplateGenerator(templateOptions);
    await generator.generate();

    console.log('✅ Plugin template generated successfully!');
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${path.relative(process.cwd(), outputDir)}`);
    console.log('  npm install');
    console.log('  npm run build');
    console.log('  npm test');
    console.log('');
    console.log('For more information, see the README.md file in your plugin directory.');

  } catch (error) {
    console.error('❌ Error generating plugin template:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

export { main, parseArgs, validateOptions };