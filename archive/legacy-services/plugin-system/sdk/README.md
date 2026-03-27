# @mnbara/plugin-sdk

The official Plugin SDK for building plugins that integrate with the MNBARA platform. This SDK provides a comprehensive set of tools and APIs for creating secure, scalable, and feature-rich plugins.

## 🚀 Features

- **🎯 Simple API** - Easy-to-use interfaces for plugin development
- **🔌 Hook System** - Event-driven architecture with powerful hook capabilities
- **🔐 Security First** - Built-in permission system and sandboxing support
- **📊 Storage API** - Persistent storage for plugin data
- **🌐 Platform API** - Seamless integration with platform services
- **📝 TypeScript Support** - Full TypeScript definitions and type safety
- **🔧 Development Tools** - Templates, validators, and debugging utilities
- **⚡ High Performance** - Optimized for speed and reliability

## 📦 Installation

```bash
npm install @mnbara/plugin-sdk
```

## 🎯 Quick Start

### Basic Plugin

```typescript
import { PluginSDK } from '@mnbara/plugin-sdk';

// Create a plugin instance
const plugin = new PluginSDK({
  pluginId: 'my-awesome-plugin',
  pluginName: 'My Awesome Plugin',
  version: '1.0.0',
  permissions: ['user.read', 'analytics.write'],
  debug: true
});

// Initialize the plugin
await plugin.initialize();

// Register a hook
plugin.registerHook('user:login', async (data, context) => {
  context.logger.info('User logged in', data);
  
  // Track the event
  await context.api.post('/analytics/track', {
    event: 'user_login',
    userId: data.userId
  });
  
  return { success: true };
});

// Execute a hook
const result = await plugin.executeHook('user:login', {
  userId: 'user123',
  timestamp: new Date()
});
```

### Using PluginBuilder (Fluent API)

```typescript
import { PluginBuilder } from '@mnbara/plugin-sdk';

// Create a plugin using the fluent builder
const plugin = await new PluginBuilder({
  id: 'stripe-payment',
  name: 'Stripe Payment Gateway',
  version: '1.0.0',
  description: 'Process payments with Stripe'
})
  .addPermissions(['payment.process', 'payment.refund'])
  .setCategory('payment')
  .addTags(['payment', 'stripe', 'gateway'])
  .addHook('payment:process', async (data, context) => {
    // Process payment logic here
    return {
      success: true,
      transactionId: 'txn_12345'
    };
  })
  .addHook('payment:refund', async (data, context) => {
    // Process refund logic here
    return {
      success: true,
      refundId: 'ref_67890'
    };
  })
  .build();
```

### Using Templates

```typescript
import { PluginBuilder } from '@mnbara/plugin-sdk';

// Create a payment plugin from template
const paymentPlugin = await PluginBuilder.paymentPlugin({
  id: 'my-stripe-gateway',
  name: 'My Stripe Gateway',
  version: '1.0.0'
})
  .addHook('payment:process', async (data, context) => {
    // Custom payment processing logic
    return { success: true, transactionId: 'txn_custom' };
  })
  .build();
```

## 📋 API Reference

### PluginSDK

The main class for creating and managing plugins.

#### Constructor Options

```typescript
interface PluginSDKConfig {
  pluginId: string;           // Unique plugin identifier
  pluginName: string;         // Display name
  version: string;            // Plugin version
  permissions: string[];     // Required permissions
  hooks?: string[];          // Supported hooks
  sandbox?: boolean;           // Enable sandboxing (default: true)
  debug?: boolean;            // Enable debug logging
}
```

#### Methods

- `initialize()` - Initialize the plugin
- `registerHook(name, handler, options)` - Register a hook handler
- `executeHook(name, data)` - Execute a hook
- `createManifest(additionalData)` - Generate plugin manifest
- `getContext()` - Get plugin context
- `getConfig()` - Get plugin configuration
- `updateConfig(updates)` - Update plugin configuration
- `hasPermission(permission)` - Check if plugin has permission

### PluginBuilder

Fluent API for building plugins.

#### Methods

- `addPermission(permission)` - Add a permission
- `addPermissions(permissions)` - Add multiple permissions
- `addHook(name, handler, options)` - Add a hook
- `addDependency(name, version)` - Add a dependency
- `setConfigSchema(schema)` - Set configuration schema
- `setCategory(category)` - Set plugin category
- `addTags(tags)` - Add tags
- `setIcon(icon)` - Set icon
- `buildManifest()` - Build plugin manifest
- `build()` - Build and initialize plugin

#### Static Methods

- `PluginBuilder.paymentPlugin(config)` - Create payment plugin template
- `PluginBuilder.analyticsPlugin(config)` - Create analytics plugin template
- `PluginBuilder.emailPlugin(config)` - Create email plugin template
- `PluginBuilder.fromTemplate(template, config)` - Create from template

### Plugin Context

The context object provides access to plugin services:

```typescript
interface PluginContext {
  pluginId: string;
  pluginName: string;
  version: string;
  permissions: string[];
  hooks: Map<string, HookRegistration>;
  config: Record<string, any>;
  logger: PluginLogger;      // Logging utilities
  api: PluginAPI;             // Platform API client
  storage: PluginStorage;       // Persistent storage
  events: PluginEventBus;       // Event system
}
```

### Storage API

```typescript
// Store data
await context.storage.set('user_preferences', { theme: 'dark' });

// Retrieve data
const preferences = await context.storage.get('user_preferences');

// List keys
const keys = await context.storage.list();

// Delete data
await context.storage.delete('user_preferences');

// Clear all data
await context.storage.clear();
```

### Platform API

```typescript
// Make API requests
const response = await context.api.get('/users/profile', { id: 'user123' });
const result = await context.api.post('/analytics/track', { event: 'signup' });
const updated = await context.api.put('/users/profile', { name: 'John Doe' });
const deleted = await context.api.delete('/users/session');
```

### Event System

```typescript
// Listen to events
context.events.on('user:login', (data) => {
  console.log('User logged in:', data);
});

// Emit events
context.events.emit('custom:event', { message: 'Hello World' });

// One-time event listeners
context.events.once('init:complete', () => {
  console.log('Initialization complete!');
});
```

### Logging

```typescript
// Different log levels
context.logger.info('Information message');
context.logger.warn('Warning message');
context.logger.error('Error message', new Error('Something went wrong'));
context.logger.debug('Debug message', { data: 'debug info' });
```

## 🛠️ Development Tools

### PluginDevUtils

Utility functions for plugin development:

```typescript
import { PluginDevUtils } from '@mnbara/plugin-sdk';

// Validate plugin manifest
const validation = PluginDevUtils.validateManifest(manifest);
console.log('Valid:', validation.valid);
console.log('Errors:', validation.errors);

// Generate plugin template code
const templateCode = PluginDevUtils.generatePluginTemplate('payment', {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0'
});

// Get available templates
const templates = PluginDevUtils.getPluginTemplates();
```

## 📁 Project Structure

A typical plugin project structure:

```
my-plugin/
├── src/
│   ├── index.ts          # Main plugin file
│   ├── hooks.ts          # Hook handlers
│   ├── config.ts         # Configuration
│   └── utils.ts          # Utility functions
├── plugin.json           # Plugin manifest
├── plugin.config.json    # Plugin configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Security

The SDK includes several security features:

- **Permission System**: Plugins must declare required permissions
- **Sandboxing**: Optional sandboxing for plugin execution
- **Input Validation**: Built-in validation for hooks and data
- **Timeout Protection**: Automatic timeout for hook execution
- **Error Isolation**: Errors in plugins don't crash the platform

## 🚀 Deployment

### Building Your Plugin

```bash
# Install dependencies
npm install

# Build the plugin
npm run build

# Test the plugin
npm test
```

### Plugin Manifest

Every plugin needs a `plugin.json` manifest file:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A description of my plugin",
  "author": "Your Name",
  "license": "MIT",
  "permissions": ["user.read", "analytics.write"],
  "hooks": ["user:login", "user:logout"],
  "dependencies": {
    "some-package": "^1.0.0"
  }
}
```

## 🧪 Testing

The SDK provides utilities for testing plugins:

```typescript
import { PluginSDK } from '@mnbara/plugin-sdk';

describe('My Plugin', () => {
  let plugin: PluginSDK;

  beforeEach(async () => {
    plugin = new PluginSDK({
      pluginId: 'test-plugin',
      pluginName: 'Test Plugin',
      version: '1.0.0',
      permissions: ['test.permission']
    });
    
    await plugin.initialize();
  });

  test('should process payment', async () => {
    plugin.registerHook('payment:process', async (data) => {
      return { success: true, transactionId: 'test_123' };
    });

    const result = await plugin.executeHook('payment:process', {
      amount: 99.99,
      currency: 'USD'
    });

    expect(result.success).toBe(true);
    expect(result.transactionId).toBe('test_123');
  });
});
```

## 📚 Examples

Check out the [examples](./examples) directory for complete plugin examples:

- **Basic Plugin**: Simple plugin with basic hooks
- **Payment Gateway**: Stripe integration example
- **Analytics Plugin**: Google Analytics integration
- **Email Marketing**: Mailchimp integration
- **Live Streaming**: Custom streaming plugin

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://docs.mnbara.com/plugins)
- 💬 [Discord Community](https://discord.gg/mnbara)
- 🐛 [Issue Tracker](https://github.com/mnbara/platform/issues)
- 📧 [Email Support](mailto:support@mnbara.com)

---

**Happy Plugin Development!** 🎉