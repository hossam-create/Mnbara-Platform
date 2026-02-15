# Plugin Development Guide

This guide provides comprehensive instructions for developing plugins for the MNBara platform using the Plugin Developer Tools.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Architecture](#plugin-architecture)
3. [Creating Your First Plugin](#creating-your-first-plugin)
4. [Plugin Configuration](#plugin-configuration)
5. [Hooks and Events](#hooks-and-events)
6. [Testing Your Plugin](#testing-your-plugin)
7. [Publishing Your Plugin](#publishing-your-plugin)
8. [Best Practices](#best-practices)
9. [Advanced Topics](#advanced-topics)

## Getting Started

### Prerequisites

- Node.js 16.0.0 or higher
- npm or yarn package manager
- Basic knowledge of TypeScript/JavaScript

### Installation

Install the Plugin Developer Tools globally:

```bash
npm install -g @mnbara/plugin-dev-tools
```

Or use it locally in your project:

```bash
npm install @mnbara/plugin-dev-tools
```

### Verify Installation

```bash
plugin-dev --version
```

## Plugin Architecture

### Plugin Structure

A typical plugin has the following structure:

```
my-plugin/
├── src/
│   ├── index.ts          # Main plugin file
│   ├── components/       # UI components (if applicable)
│   ├── utils/           # Utility functions
│   └── types/           # TypeScript type definitions
├── dist/                # Compiled output
├── tests/               # Test files
├── manifest.json        # Plugin configuration
├── package.json         # NPM package configuration
├── tsconfig.json        # TypeScript configuration
└── README.md           # Documentation
```

### Core Components

1. **Plugin Interface**: The main plugin class that implements the Plugin interface
2. **Configuration**: Plugin-specific configuration options
3. **Hooks**: Event handlers for platform events
4. **Permissions**: Required permissions for plugin functionality
5. **Dependencies**: External libraries and platform modules

## Creating Your First Plugin

### Step 1: Create a New Plugin

```bash
plugin-dev create my-first-plugin basic
```

This creates a new plugin using the basic template.

### Step 2: Navigate to Plugin Directory

```bash
cd my-first-plugin
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Start Development Server

```bash
npm run dev
```

### Step 5: Build for Production

```bash
npm run build
```

## Plugin Configuration

### manifest.json

The manifest.json file defines your plugin's metadata and configuration:

```json
{
  "name": "my-first-plugin",
  "version": "1.0.0",
  "description": "My first plugin for MNBara platform",
  "main": "dist/index.js",
  "type": "custom",
  "author": "Your Name",
  "license": "MIT",
  "config": {
    "apiKey": "string",
    "enabled": "boolean",
    "maxItems": "number"
  },
  "hooks": {
    "user:login": "onUserLogin",
    "user:logout": "onUserLogout"
  },
  "permissions": [
    "user:read",
    "data:write"
  ],
  "dependencies": {
    "@mnbara/plugin-core": "^1.0.0"
  }
}
```

### Configuration Types

Supported configuration types:

- `string` - Text values
- `number` - Numeric values
- `boolean` - True/false values
- `array` - Array of values
- `object` - Complex objects

## Hooks and Events

### Available Hooks

Platform hooks include:

- **User Events**: `user:login`, `user:logout`, `user:register`, `user:update`
- **Product Events**: `product:listed`, `product:sold`, `product:price-changed`
- **Order Events**: `order:created`, `order:completed`, `order:cancelled`
- **Stream Events**: `stream:start`, `stream:stop`, `stream:viewer-joined`
- **Chat Events**: `chat:message`, `chat:join`, `chat:leave`
- **System Events**: `system:startup`, `system:shutdown`, `system:maintenance`

### Implementing Hook Handlers

```typescript
export class MyFirstPlugin implements Plugin {
  async onUserLogin(data: { userId: string; timestamp: Date }): Promise<void> {
    console.log(`User ${data.userId} logged in at ${data.timestamp}`);
    // Your logic here
  }

  async onUserLogout(data: { userId: string; timestamp: Date }): Promise<void> {
    console.log(`User ${data.userId} logged out at ${data.timestamp}`);
    // Your logic here
  }
}
```

### Adding Hooks Dynamically

```bash
plugin-dev add-hook ./my-first-plugin user:login onUserLogin
plugin-dev add-hook ./my-first-plugin product:listed onProductListed
```

## Testing Your Plugin

### Running Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:coverage
```

### Watch Mode

```bash
npm run test:watch
```

### Writing Tests

Create test files in the `tests/` directory:

```typescript
// tests/plugin.test.ts
import { MyFirstPlugin } from '../src/index';

describe('MyFirstPlugin', () => {
  let plugin: MyFirstPlugin;

  beforeEach(() => {
    plugin = new MyFirstPlugin(mockContext);
  });

  test('should initialize successfully', async () => {
    await expect(plugin.initialize()).resolves.not.toThrow();
  });

  test('should handle user login', async () => {
    const mockData = { userId: 'user123', timestamp: new Date() };
    await expect(plugin.onUserLogin(mockData)).resolves.not.toThrow();
  });
});
```

## Publishing Your Plugin

### Step 1: Validate Plugin

```bash
plugin-dev validate ./my-first-plugin
```

### Step 2: Generate Documentation

```bash
plugin-dev docs ./my-first-plugin
```

### Step 3: Package Plugin

```bash
plugin-dev package ./my-first-plugin
```

### Step 4: Publish to Marketplace

```bash
plugin-dev publish ./my-first-plugin https://plugins.mnbara.com
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
async onUserLogin(data: any): Promise<void> {
  try {
    // Your logic here
  } catch (error) {
    console.error('Failed to handle user login:', error);
    // Don't throw errors in hook handlers unless critical
  }
}
```

### 2. Logging

Use appropriate logging levels:

```typescript
console.log('Info: Plugin initialized');
console.warn('Warning: Configuration missing');
console.error('Error: Failed to process data');
```

### 3. Configuration Validation

Validate configuration on initialization:

```typescript
async initialize(): Promise<void> {
  if (!this.config.apiKey) {
    throw new Error('API key is required');
  }
  
  if (this.config.maxItems < 0) {
    throw new Error('maxItems must be non-negative');
  }
}
```

### 4. Resource Management

Clean up resources properly:

```typescript
async destroy(): Promise<void> {
  // Close connections
  if (this.apiClient) {
    await this.apiClient.close();
  }
  
  // Clear timers
  if (this.refreshTimer) {
    clearInterval(this.refreshTimer);
  }
  
  // Clear caches
  this.cache.clear();
}
```

### 5. Performance

- Use efficient data structures
- Implement caching where appropriate
- Avoid blocking operations in hook handlers
- Use async/await for asynchronous operations

## Advanced Topics

### Custom Templates

Create your own plugin templates:

```bash
plugin-dev create my-custom-plugin path/to/my/template
```

### Plugin Dependencies

Manage plugin dependencies:

```bash
plugin-dev add-dependency ./my-plugin @mnbara/analytics
plugin-dev remove-dependency ./my-plugin old-dependency
```

### Plugin Upgrades

Upgrade plugin to latest platform version:

```bash
plugin-dev upgrade ./my-plugin latest
```

### Workspace Management

Initialize a plugin workspace:

```bash
plugin-dev init my-plugin-workspace
```

### Custom Hooks

Define custom hooks for your plugin:

```typescript
// In your plugin class
async registerCustomHooks(): Promise<void> {
  this.context.hookSystem.registerHook('my-plugin:custom-event');
}

// Emit custom events
async emitCustomEvent(data: any): Promise<void> {
  await this.context.hookSystem.emit('my-plugin:custom-event', data);
}
```

### Integration with External Services

Integrate with external APIs:

```typescript
private setupApiClient(): void {
  this.apiClient = axios.create({
    baseURL: this.config.apiEndpoint,
    headers: {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    }
  });
}

private async fetchExternalData(): Promise<any> {
  try {
    const response = await this.apiClient.get('/data');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch external data:', error);
    throw error;
  }
}
```

### Security Considerations

- Always validate input data
- Use secure connections (HTTPS)
- Implement proper authentication
- Follow the principle of least privilege
- Regularly update dependencies

### Performance Optimization

- Implement caching strategies
- Use efficient algorithms
- Minimize memory usage
- Optimize database queries
- Use connection pooling

### Monitoring and Analytics

- Implement health checks
- Add performance metrics
- Use structured logging
- Monitor error rates
- Track plugin usage

## Troubleshooting

### Common Issues

1. **Plugin fails to initialize**: Check configuration and dependencies
2. **Hooks not firing**: Verify hook registration and permissions
3. **Build errors**: Check TypeScript configuration and imports
4. **Test failures**: Ensure proper mocking and setup
5. **Publishing errors**: Validate plugin structure and metadata

### Debug Mode

Enable debug logging:

```bash
DEBUG=plugin-dev plugin-dev dev ./my-plugin
```

### Getting Help

- Check the documentation
- Review example plugins
- Join the community forum
- Contact support

## Examples

### Example 1: Analytics Plugin

```typescript
export class AnalyticsPlugin implements Plugin {
  private metrics: Map<string, number> = new Map();

  async onUserLogin(data: { userId: string }): Promise<void> {
    this.incrementMetric('user_logins');
  }

  async onProductSold(data: { productId: string; price: number }): Promise<void> {
    this.incrementMetric('products_sold');
    this.incrementMetric('revenue', data.price);
  }

  private incrementMetric(name: string, value: number = 1): void {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}
```

### Example 2: Notification Plugin

```typescript
export class NotificationPlugin implements Plugin {
  private notificationQueue: any[] = [];

  async onOrderCreated(data: { orderId: string; userId: string }): Promise<void> {
    await this.sendNotification(data.userId, {
      type: 'order_created',
      message: 'Your order has been created successfully',
      orderId: data.orderId
    });
  }

  async onOrderCompleted(data: { orderId: string; userId: string }): Promise<void> {
    await this.sendNotification(data.userId, {
      type: 'order_completed',
      message: 'Your order has been completed',
      orderId: data.orderId
    });
  }

  private async sendNotification(userId: string, notification: any): Promise<void> {
    // Implementation for sending notifications
    console.log(`Sending notification to user ${userId}:`, notification);
  }
}
```

## Conclusion

This guide covers the essential aspects of plugin development for the MNBara platform. For more advanced topics and specific use cases, refer to the platform documentation and community resources.

Happy coding! 🚀