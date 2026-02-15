# Quick Start Example

This example demonstrates how to create a simple "Hello World" plugin in under 5 minutes.

## Step 1: Create the Plugin

```bash
plugin-dev create hello-world-plugin basic
```

## Step 2: Navigate to Plugin Directory

```bash
cd hello-world-plugin
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Edit the Plugin

Open `src/index.ts` and modify it:

```typescript
import { Plugin, PluginContext, PluginConfig } from '@mnbara/plugin-core';

export interface HelloWorldConfig extends PluginConfig {
  greeting?: string;
  language?: string;
}

export class HelloWorldPlugin implements Plugin {
  private config: HelloWorldConfig;
  private greeting: string;

  constructor(private context: PluginContext) {
    this.config = context.config as HelloWorldConfig;
    this.greeting = this.config.greeting || 'Hello';
  }

  async initialize(): Promise<void> {
    console.log(`${this.greeting} World! Plugin initialized.`);
  }

  async destroy(): Promise<void> {
    console.log('Goodbye World! Plugin destroyed.');
  }

  async onUserLogin(data: { userId: string; timestamp: Date }): Promise<void> {
    console.log(`${this.greeting} ${data.userId}! Welcome to the platform.`);
  }

  async onUserLogout(data: { userId: string; timestamp: Date }): Promise<void> {
    console.log(`Goodbye ${data.userId}! Thanks for visiting.`);
  }

  getGreeting(): string {
    return this.greeting;
  }

  setGreeting(greeting: string): void {
    this.greeting = greeting;
  }
}
```

## Step 5: Update manifest.json

```json
{
  "name": "hello-world-plugin",
  "version": "1.0.0",
  "description": "A simple Hello World plugin",
  "main": "dist/index.js",
  "type": "custom",
  "author": "Your Name",
  "license": "MIT",
  "config": {
    "greeting": "string",
    "language": "string"
  },
  "hooks": {
    "user:login": "onUserLogin",
    "user:logout": "onUserLogout"
  },
  "permissions": [
    "user:read"
  ],
  "dependencies": {
    "@mnbara/plugin-core": "^1.0.0"
  }
}
```

## Step 6: Configure the Plugin

Create a configuration file `config.json`:

```json
{
  "greeting": "Hi",
  "language": "en"
}
```

## Step 7: Test the Plugin

```bash
# Build the plugin
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

## Step 8: Validate the Plugin

```bash
plugin-dev validate ./hello-world-plugin
```

## Step 9: Package the Plugin

```bash
plugin-dev package ./hello-world-plugin
```

## Step 10: Test Hook Handlers

Create a test script `test-plugin.js`:

```javascript
const { HelloWorldPlugin } = require('./dist/index.js');

// Mock context
const mockContext = {
  config: { greeting: 'Hello', language: 'en' },
  logger: console
};

// Create plugin instance
const plugin = new HelloWorldPlugin(mockContext);

// Test initialization
plugin.initialize().then(() => {
  console.log('✅ Plugin initialized successfully');
  
  // Test user login
  return plugin.onUserLogin({ userId: 'test-user', timestamp: new Date() });
}).then(() => {
  console.log('✅ User login handled successfully');
  
  // Test user logout
  return plugin.onUserLogout({ userId: 'test-user', timestamp: new Date() });
}).then(() => {
  console.log('✅ User logout handled successfully');
  
  // Test greeting methods
  console.log(`Current greeting: ${plugin.getGreeting()}`);
  plugin.setGreeting('Hey');
  console.log(`New greeting: ${plugin.getGreeting()}`);
  
  // Cleanup
  return plugin.destroy();
}).then(() => {
  console.log('✅ Plugin destroyed successfully');
}).catch(error => {
  console.error('❌ Error:', error);
});
```

Run the test:

```bash
node test-plugin.js
```

## Expected Output

```
Hello World! Plugin initialized.
✅ Plugin initialized successfully
Hello test-user! Welcome to the platform.
✅ User login handled successfully
Goodbye test-user! Thanks for visiting.
✅ User logout handled successfully
Current greeting: Hello
New greeting: Hey
Goodbye World! Plugin destroyed.
✅ Plugin destroyed successfully
```

## Next Steps

1. **Add More Hooks**: Extend the plugin to handle more events
2. **Add Configuration**: Make the plugin more configurable
3. **Add Tests**: Write comprehensive tests
4. **Add Documentation**: Create detailed documentation
5. **Publish**: Publish to the marketplace

## Common Commands Reference

```bash
# Create a new plugin
plugin-dev create my-plugin basic

# Start development server
plugin-dev dev ./my-plugin

# Run tests
plugin-dev test ./my-plugin

# Validate plugin
plugin-dev validate ./my-plugin

# Generate documentation
plugin-dev docs ./my-plugin

# Package plugin
plugin-dev package ./my-plugin

# Add a hook
plugin-dev add-hook ./my-plugin user:register onUserRegister

# Add configuration
plugin-dev add-config ./my-plugin maxUsers number 100

# List templates
plugin-dev list-templates

# Get help
plugin-dev help
```

## Tips for Success

1. **Start Simple**: Begin with basic functionality
2. **Test Early**: Write tests as you develop
3. **Use TypeScript**: Provides better type safety
4. **Follow Conventions**: Use consistent naming and structure
5. **Document Everything**: Good documentation is crucial
6. **Handle Errors**: Always include error handling
7. **Performance**: Consider performance implications
8. **Security**: Follow security best practices

## Troubleshooting

### Build Errors
- Check TypeScript configuration
- Verify all dependencies are installed
- Ensure proper import statements

### Test Failures
- Check mock data setup
- Verify hook handler implementations
- Review error handling logic

### Validation Errors
- Check manifest.json format
- Verify required fields are present
- Ensure proper file structure

## Resources

- [Plugin Development Guide](./plugin-development-guide.md)
- [API Documentation](https://docs.mnbara.com)
- [Community Forum](https://community.mnbara.com)
- [Example Plugins](https://github.com/mnbara/plugin-examples)

Congratulations! You've created your first plugin! 🎉