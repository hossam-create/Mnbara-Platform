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
  --permissions <perms>   Comma-separated permissions (optional)
  --output <dir>          Output directory (default: ./<plugin-name>)
  --help, -h              Show this help message

Examples:
  # Create a basic plugin
  mnbara-plugin-template --name "My Plugin"

  # Create a wallet integration plugin with TypeScript
  mnbara-plugin-template --name "DeFi Tools" --type wallet-integration --typescript

  # Create a UI component plugin with all features
  mnbara-plugin-template --name "Dashboard" --type ui-component --ui --hooks --config

  # Create a custom plugin with specific features
  mnbara-plugin-template --name "Analytics" --api --hooks --typescript --config
`);
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {
    name: '',
    typescript: true,
    config: true,
    permissions: []
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
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
        options.typescript = nextArg !== 'false';
        if (nextArg && nextArg !== 'false') i++;
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
        options.config = nextArg !== 'false';
        if (nextArg && nextArg !== 'false') i++;
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
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.warn(`Unknown option: ${arg}`);
        }
        break;
    }
  }

  return options;
}

function validateOptions(options: CLIOptions): void {
  if (!options.name || options.name.trim() === '') {
    throw new Error('Plugin name is required. Use --name <name>');
  }

  if (options.type && !['basic', 'wallet-integration', 'hook-provider', 'ui-component', 'api-service'].includes(options.type)) {
    throw new Error('Invalid plugin type. Must be one of: basic, wallet-integration, hook-provider, ui-component, api-service');
  }

  if (options.version && !/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/.test(options.version)) {
    throw new Error('Invalid version format. Must be in format: X.Y.Z or X.Y.Z-tag');
  }
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

function toPascalCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/[\s-_]+/g, '');
}

function getDefaultAuthor(): string {
  try {
    // Try to get author from git config
    const { execSync } = require('child_process');
    const name = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf8' }).trim();
    return `${name} <${email}>`;
  } catch {
    return 'Anonymous';
  }
}

function getDefaultPermissions(type: string): string[] {
  switch (type) {
    case 'wallet-integration':
      return ['wallet:read', 'wallet:write', 'wallet:sign', 'api:external'];
    case 'hook-provider':
      return ['hooks:register', 'hooks:trigger'];
    case 'ui-component':
      return ['ui:render', 'ui:modify'];
    case 'api-service':
      return ['api:external', 'api:internal', 'system:network'];
    default:
      return ['ui:render', 'storage:read', 'storage:write'];
  }
}

export async function main(): Promise<void> {
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
    const permissions = cliOptions.permissions && cliOptions.permissions.length > 0 
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
      description: cliOptions.description || `${toPascalCase(cliOptions.name)} plugin for MNBara`,
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

    const generator = new PluginTemplateGenerator(templateOptions);
    await generator.generate();

    console.log('✅ Plugin template generated successfully!');
  } catch (error) {
    console.error('❌ Error generating plugin template:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}