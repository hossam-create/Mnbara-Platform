#!/usr/bin/env node

import { program } from 'commander';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface PluginTemplate {
  name: string;
  description: string;
  category: 'payment' | 'analytics' | 'email' | 'notification' | 'custom';
  hooks: string[];
  permissions: string[];
  features: string[];
}

const templates: Record<string, PluginTemplate> = {
  payment: {
    name: 'payment-plugin',
    description: 'Payment processing plugin with webhook integration',
    category: 'payment',
    hooks: ['transaction:initiated', 'transaction:completed', 'transaction:failed'],
    permissions: ['read:transactions', 'write:transactions'],
    features: ['webhook', 'retry', 'config'],
  },
  analytics: {
    name: 'analytics-plugin',
    description: 'Analytics and reporting plugin with data aggregation',
    category: 'analytics',
    hooks: ['transaction:completed', 'wallet:created', 'user:registered'],
    permissions: ['read:transactions', 'read:wallets', 'read:users'],
    features: ['aggregation', 'export', 'dashboard'],
  },
  email: {
    name: 'email-plugin',
    description: 'Email notification plugin with template support',
    category: 'email',
    hooks: ['transaction:completed', 'kyc:approved', 'kyc:rejected', 'payout:processed'],
    permissions: ['read:transactions', 'read:kyc', 'read:payouts'],
    features: ['templates', 'smtp', 'queue'],
  },
  notification: {
    name: 'notification-plugin',
    description: 'Push notification plugin with multi-channel support',
    category: 'notification',
    hooks: ['transaction:completed', 'system:alert', 'wallet:low_balance'],
    permissions: ['read:transactions', 'read:wallets'],
    features: ['push', 'sms', 'in-app'],
  },
  custom: {
    name: 'custom-plugin',
    description: 'Custom plugin template with basic structure',
    category: 'custom',
    hooks: ['transaction:completed'],
    permissions: ['read:transactions'],
    features: ['config', 'logging'],
  },
};

function createPackageJson(projectPath: string, template: PluginTemplate, options: any) {
  const packageJson = {
    name: options.name,
    version: '1.0.0',
    description: template.description,
    main: 'dist/index.js',
    scripts: {
      build: 'tsc',
      dev: 'ts-node-dev --respawn --transpile-only src/index.ts',
      test: 'jest',
      'test:watch': 'jest --watch',
      package: 'npm run build && npm pack',
      lint: 'eslint src/**/*.ts',
      'lint:fix': 'eslint src/**/*.ts --fix',
    },
    keywords: ['mnbara', 'plugin', template.category],
    author: options.author,
    license: 'MIT',
    dependencies: {
      '@mnbara/plugin-sdk': '^1.0.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      '@typescript-eslint/eslint-plugin': '^6.0.0',
      '@typescript-eslint/parser': '^6.0.0',
      'eslint': '^8.0.0',
      'jest': '^29.0.0',
      'ts-jest': '^29.0.0',
      'ts-node-dev': '^2.0.0',
      'typescript': '^5.0.0',
    },
  };

  fs.writeFileSync(
    path.join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

function createTsConfig(projectPath: string) {
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
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist', '**/*.test.ts'],
  };

  fs.writeFileSync(
    path.join(projectPath, 'tsconfig.json'),
    JSON.stringify(tsConfig, null, 2)
  );
}

function createJestConfig(projectPath: string) {
  const jestConfig = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.d.ts',
      '!src/**/*.test.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
  };

  fs.writeFileSync(
    path.join(projectPath, 'jest.config.js'),
    `module.exports = ${JSON.stringify(jestConfig, null, 2)};`
  );
}

function createEslintConfig(projectPath: string) {
  const eslintConfig = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      '@typescript-eslint/recommended',
    ],
    plugins: ['@typescript-eslint'],
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  };

  fs.writeFileSync(
    path.join(projectPath, '.eslintrc.json'),
    JSON.stringify(eslintConfig, null, 2)
  );
}

function createGitignore(projectPath: string) {
  const gitignore = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Coverage reports
coverage/
.nyc_output/

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Plugin package
*.plugin
*.tgz

# Temporary files
tmp/
temp/
`.trim();

  fs.writeFileSync(path.join(projectPath, '.gitignore'), gitignore);
}

function createManifest(projectPath: string, template: PluginTemplate, options: any) {
  const manifest = {
    name: options.name,
    version: options.version,
    description: template.description,
    author: options.author,
    category: template.category,
    hooks: template.hooks,
    permissions: template.permissions,
    config: {
      enabled: true,
      debug: false,
    },
  };

  fs.writeFileSync(
    path.join(projectPath, 'src', 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
}

function createPluginCode(projectPath: string, template: PluginTemplate, options: any) {
  let code = '';

  // Import statements
  code += `import { PluginBuilder } from '@mnbara/plugin-sdk';
import manifest from './manifest.json';

`;

  // Configuration handling
  if (template.features.includes('config')) {
    code += `// Configuration validation
const validateConfig = (config: any) => {
  if (!config || typeof config !== 'object') {
    throw new Error('Invalid configuration provided');
  }
  
  // Add your configuration validation logic here
  return true;
};

`;
  }

  // Webhook handling for payment plugins
  if (template.features.includes('webhook')) {
    code += `// Webhook handler
const handleWebhook = async (payload: any) => {
  // Add your webhook processing logic here
  console.log('Processing webhook:', payload);
};

`;
  }

  // Retry logic for payment plugins
  if (template.features.includes('retry')) {
    code += `// Retry mechanism
const retryOperation = async (operation: () => Promise<any>, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(\`Attempt \${attempt} failed:\`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
};

`;
  }

  // Main plugin builder
  code += `// Build the plugin
const plugin = new PluginBuilder(manifest)
`;

  // Add configuration update handler
  if (template.features.includes('config')) {
    code += `  .onConfigUpdate(async (newConfig, oldConfig) => {
    console.log('Configuration updated:', newConfig);
    validateConfig(newConfig);
    // Add your configuration update logic here
  })
`;
  }

  // Add hook handlers based on template
  template.hooks.forEach(hook => {
    code += `  .onHook('${hook}', async (data) => {
    console.log('Hook triggered: ${hook}', data);
    
    try {
      // Add your hook processing logic here
      await process${hook.split(':')[1].charAt(0).toUpperCase() + hook.split(':')[1].slice(1)}(data);
    } catch (error) {
      console.error('Error processing hook ${hook}:', error);
      throw error;
    }
  })
`;
  });

  // Add initialization handler
  code += `  .onInit(async (config) => {
    console.log('Plugin initialized with config:', config);
    
    if (config.validateConfig) {
      validateConfig(config);
    }
    
    // Add your initialization logic here
  })
`;

  // Add cleanup handler
  code += `  .onCleanup(async () => {
    console.log('Plugin cleanup');
    // Add your cleanup logic here
  })
`;

  code += `  .build();

export default plugin;
`;

  // Helper functions
  code += `
// Helper functions
`;

  template.hooks.forEach(hook => {
    const hookName = hook.split(':')[1];
    const functionName = 'process' + hookName.charAt(0).toUpperCase() + hookName.slice(1);
    
    code += `async function ${functionName}(data: any) {
  // Add your ${hookName} processing logic here
  console.log('Processing ${hookName}:', data);
}

`;
  });

  fs.writeFileSync(path.join(projectPath, 'src', 'index.ts'), code);
}

function createTestFile(projectPath: string, template: PluginTemplate, options: any) {
  let testCode = '';

  testCode += `import { PluginBuilder } from '@mnbara/plugin-sdk';
import plugin from '../index';
import manifest from '../manifest.json';

describe('${options.name} Plugin', () => {
  it('should load successfully', () => {
    expect(plugin).toBeDefined();
    expect(plugin.manifest).toEqual(manifest);
  });

  it('should have correct manifest', () => {
    expect(manifest.name).toBe('${options.name}');
    expect(manifest.version).toBe('${options.version}');
    expect(manifest.author).toBe('${options.author}');
    expect(manifest.category).toBe('${template.category}');
  });

  it('should handle configuration', async () => {
    const config = { enabled: true, debug: false };
    
    // Test configuration handling
    await expect(plugin.init(config)).resolves.not.toThrow();
  });
`;

  template.hooks.forEach(hook => {
    testCode += `
  it('should handle ${hook} hook', async () => {
    const mockData = {
      id: 'test-123',
      amount: 100,
      currency: 'USD',
      timestamp: new Date().toISOString(),
    };
    
    // Test hook execution
    await expect(plugin.hooks.execute('${hook}', mockData)).resolves.not.toThrow();
  });
`;
  });

  testCode += `});
`;

  fs.writeFileSync(
    path.join(projectPath, 'src', '__tests__', 'plugin.test.ts'),
    testCode
  );
}

function createReadme(projectPath: string, template: PluginTemplate, options: any) {
  const readme = `# ${options.name}

${template.description}

## Installation

\`\`\`bash
npm install
npm run build
\`\`\`

## Configuration

Add your configuration in the plugin settings:

\`\`\`json
{
  "enabled": true,
  "debug": false,
  // Add your custom configuration here
}
`\`\`\n
## Features

${template.features.map(feature => `- ${feature}`).join('\n')}

## Hooks

This plugin listens to the following hooks:

${template.hooks.map(hook => `- \`${hook}\``).join('\n')}

## Permissions

Required permissions:

${template.permissions.map(permission => `- \`${permission}\``).join('\n')}

## Development

\`\`\`bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Package for distribution
npm run package
\`\`\`

## Author

${options.author}

## License

MIT
`;

  fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
}

function createProjectStructure(projectPath: string, template: PluginTemplate, options: any) {
  // Create directories
  fs.mkdirSync(path.join(projectPath, 'src'), { recursive: true });
  fs.mkdirSync(path.join(projectPath, 'src', '__tests__'), { recursive: true });

  // Create files
  createPackageJson(projectPath, template, options);
  createTsConfig(projectPath);
  createJestConfig(projectPath);
  createEslintConfig(projectPath);
  createGitignore(projectPath);
  createManifest(projectPath, template, options);
  createPluginCode(projectPath, template, options);
  createTestFile(projectPath, template, options);
  createReadme(projectPath, template, options);
}

program
  .name('create-mnbara-plugin')
  .description('Create a new MNBara plugin')
  .version('1.0.0')
  .argument('<name>', 'plugin name')
  .option('-t, --template <template>', 'plugin template (payment, analytics, email, notification, custom)', 'custom')
  .option('-a, --author <author>', 'author name', 'Anonymous')
  .option('-v, --version <version>', 'initial version', '1.0.0')
  .option('-d, --directory <directory>', 'project directory', '.')
  .action((name, options) => {
    const template = templates[options.template];
    if (!template) {
      console.error(`Unknown template: ${options.template}`);
      console.log('Available templates:', Object.keys(templates).join(', '));
      process.exit(1);
    }

    const projectPath = path.resolve(options.directory, name);

    if (fs.existsSync(projectPath)) {
      console.error(`Directory already exists: ${projectPath}`);
      process.exit(1);
    }

    console.log(`Creating ${name} plugin with ${options.template} template...`);

    try {
      createProjectStructure(projectPath, template, {
        name,
        author: options.author,
        version: options.version,
        directory: options.directory,
      });

      console.log(`✅ Plugin created successfully at: ${projectPath}`);
      console.log('\nNext steps:');
      console.log(`  cd ${name}`);
      console.log('  npm install');
      console.log('  npm run dev');
      console.log('\nHappy coding! 🚀');

      // Try to install dependencies automatically
      try {
        console.log('\nInstalling dependencies...');
        execSync('npm install', { cwd: projectPath, stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
      } catch (error) {
        console.log('⚠️  Failed to install dependencies automatically');
        console.log('   Please run "npm install" manually');
      }
    } catch (error) {
      console.error('❌ Failed to create plugin:', error);
      process.exit(1);
    }
  });

program.parse();