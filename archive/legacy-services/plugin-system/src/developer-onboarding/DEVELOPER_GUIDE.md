# 🚀 Developer Onboarding Guide - MNBara Plugin System

Welcome to the MNBara Plugin System! This guide will help you create, publish, and manage your plugins effectively.

## 📋 Table of Contents

1. [Getting Started](#getting-started)
2. [Plugin Development](#plugin-development)
3. [Documentation](#documentation)
4. [Publishing](#publishing)
5. [Analytics & Monitoring](#analytics--monitoring)
6. [Best Practices](#best-practices)
7. [Support](#support)

## 🎯 Getting Started

### 1. Register as a Developer

First, create your developer account:

```bash
# Register as a developer
curl -X POST https://api.mnbara.com/api/developers/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "username": "your-username",
    "password": "your-secure-password",
    "fullName": "Your Full Name",
    "company": "Your Company (optional)",
    "website": "https://your-website.com (optional)",
    "githubUsername": "your-github-username (optional)",
    "bio": "Brief description about yourself"
  }'
```

### 2. Verify Your Email

Check your email for a verification link. Click it to activate your account.

### 3. Get Your API Key

```bash
# Login to get your API key
curl -X POST https://api.mnbara.com/api/developers/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

## 🔧 Plugin Development

### 1. Install the Plugin CLI

```bash
npm install -g @mnbara/plugin-cli
```

### 2. Create a New Plugin

```bash
# Create a new plugin
mnbara-plugin create my-awesome-plugin

# Follow the interactive prompts
# Select plugin type: payment-gateway, analytics, shipping, etc.
# Choose features: hooks, API endpoints, UI components, wallet integration
```

### 3. Plugin Structure

Your plugin will have this structure:

```
my-awesome-plugin/
├── src/
│   ├── index.ts              # Main plugin entry point
│   ├── hooks/                # Hook implementations
│   │   └── example.hook.ts
│   ├── api/                  # API endpoints
│   │   └── routes.ts
│   ├── ui/                   # UI components
│   │   └── components/
│   └── services/             # Business logic
│       └── example.service.ts
├── tests/                    # Unit tests
│   └── index.test.ts
├── plugin.json               # Plugin manifest
├── package.json
├── tsconfig.json
└── README.md
```

### 4. Plugin Manifest (plugin.json)

```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "A brief description of your plugin",
  "author": "Your Name <your-email@example.com>",
  "category": "analytics",
  "type": "payment-gateway",
  "permissions": [
    "read:user-data",
    "write:analytics",
    "access:payment-processing"
  ],
  "hooks": [
    {
      "name": "user.login",
      "handler": "onUserLogin",
      "priority": 100
    }
  ],
  "apiEndpoints": [
    {
      "path": "/api/my-plugin/data",
      "method": "GET",
      "handler": "getPluginData"
    }
  ],
  "uiComponents": [
    {
      "name": "AnalyticsDashboard",
      "type": "dashboard-widget"
    }
  ],
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "description": "API key for external service"
    },
    "enableFeatureX": {
      "type": "boolean",
      "default": false,
      "description": "Enable experimental feature X"
    }
  },
  "dependencies": {
    "@mnbara/plugin-sdk": "^1.0.0"
  }
}
```

### 5. Plugin Implementation Example

```typescript
// src/index.ts
import { MnbaraPlugin, PluginContext } from '@mnbara/plugin-sdk';

export default class MyAwesomePlugin extends MnbaraPlugin {
  constructor(context: PluginContext) {
    super(context);
  }

  async initialize(): Promise<void> {
    // Initialize your plugin
    this.context.logger.info('MyAwesomePlugin initialized');
  }

  async onUserLogin(userId: string, userData: any): Promise<void> {
    // Handle user login event
    this.context.logger.info(`User ${userId} logged in`);
    
    // Track analytics
    await this.context.analytics.track('user.login', {
      userId,
      timestamp: new Date()
    });
  }

  async getPluginData(): Promise<any> {
    // Return plugin data
    return {
      message: 'Hello from MyAwesomePlugin!',
      version: '1.0.0'
    };
  }
}
```

## 📚 Documentation

### 1. Create Documentation

Use our documentation templates to create comprehensive guides:

```bash
# Get available templates
mnbara-plugin docs templates

# Create documentation from template
mnbara-plugin docs create --template analytics --plugin my-awesome-plugin
```

### 2. Documentation Structure

```
docs/
├── getting-started.md      # Quick start guide
├── api-reference.md        # API documentation
├── examples.md             # Code examples
├── troubleshooting.md      # Common issues
└── changelog.md           # Version history
```

### 3. Documentation Example

```markdown
# My Awesome Plugin Documentation

## Getting Started

### Installation
```bash
npm install my-awesome-plugin
```

### Configuration
```javascript
{
  "apiKey": "your-api-key",
  "enableFeatureX": true
}
```

## API Reference

### Endpoints

#### GET /api/my-plugin/data
Returns plugin data.

**Response:**
```json
{
  "message": "Hello from MyAwesomePlugin!",
  "version": "1.0.0"
}
```

## Examples

### Basic Usage
```typescript
import MyAwesomePlugin from 'my-awesome-plugin';

const plugin = new MyAwesomePlugin(context);
await plugin.initialize();
```
```

## 🚀 Publishing

### 1. Test Your Plugin

```bash
# Run tests
npm test

# Test in sandbox environment
mnbara-plugin test --sandbox
```

### 2. Build for Production

```bash
# Build plugin
npm run build

# Package plugin
mnbara-plugin package
```

### 3. Submit to Marketplace

```bash
# Submit plugin
mnbara-plugin submit \
  --name "My Awesome Plugin" \
  --description "A brief description" \
  --category "analytics" \
  --price 0 \
  --package ./dist/my-awesome-plugin.zip
```

### 4. API Submission

```bash
# Submit via API
curl -X POST https://api.mnbara.com/api/plugins/submit \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Awesome Plugin",
    "description": "A brief description",
    "category": "analytics",
    "price": 0,
    "manifest": { /* plugin.json content */ },
    "package": "base64-encoded-package"
  }'
```

## 📊 Analytics & Monitoring

### 1. View Your Dashboard

Visit the [Developer Dashboard](https://mnbara.com/developers/dashboard) to see:

- Plugin performance metrics
- Download statistics
- User reviews and ratings
- Revenue tracking
- Error logs and monitoring

### 2. API Analytics

```bash
# Get plugin analytics
curl -X GET https://api.mnbara.com/api/developers/analytics \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get specific plugin stats
curl -X GET https://api.mnbara.com/api/developers/plugins \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 3. Webhook Notifications

Set up webhooks to receive notifications about:

- New installations
- User reviews
- Plugin updates
- Error reports

```javascript
// Webhook payload example
{
  "event": "plugin.installed",
  "pluginId": "my-awesome-plugin",
  "userId": "user-123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🎯 Best Practices

### 1. Security

- **Never expose sensitive data** in logs or responses
- **Validate all inputs** thoroughly
- **Use secure API keys** and rotate them regularly
- **Implement rate limiting** for your endpoints
- **Follow the principle of least privilege**

### 2. Performance

- **Optimize database queries** and use indexes
- **Implement caching** where appropriate
- **Use async/await** for non-blocking operations
- **Monitor memory usage** and prevent leaks
- **Handle errors gracefully** with proper logging

### 3. User Experience

- **Provide clear error messages** that help users
- **Implement proper validation** with helpful feedback
- **Use consistent naming conventions** throughout
- **Document your APIs** comprehensively
- **Test thoroughly** in different environments

### 4. Code Quality

- **Write unit tests** for all critical functions
- **Use TypeScript** for better type safety
- **Follow ESLint rules** and code formatting
- **Implement proper error handling**
- **Use semantic versioning** for releases

### 5. Marketplace Success

- **Choose the right category** for your plugin
- **Write compelling descriptions** with keywords
- **Provide excellent documentation**
- **Respond to user reviews** promptly
- **Keep your plugin updated** and maintained

## 🔧 Development Tools

### Plugin CLI Commands

```bash
# Create new plugin
mnbara-plugin create <name>

# Development server
mnbara-plugin dev

# Run tests
mnbara-plugin test

# Build for production
mnbara-plugin build

# Package plugin
mnbara-plugin package

# Submit to marketplace
mnbara-plugin submit

# Documentation tools
mnbara-plugin docs create
mnbara-plugin docs validate
mnbara-plugin docs publish
```

### SDK Methods

```typescript
// Logging
this.context.logger.info('Information message');
this.context.logger.error('Error message', error);
this.context.logger.warn('Warning message');

// Database access
const data = await this.context.database.query('SELECT * FROM users');
await this.context.database.execute('INSERT INTO logs ...');

// Cache operations
await this.context.cache.set('key', value, 3600); // 1 hour TTL
const cached = await this.context.cache.get('key');

// Event emission
await this.context.events.emit('custom.event', { data: 'value' });

// Metrics
await this.context.metrics.increment('user.actions');
await this.context.metrics.timing('api.response', 150); // 150ms

// Storage
await this.context.storage.upload('file.txt', buffer);
const file = await this.context.storage.download('file.txt');
```

## 🆘 Support

### Getting Help

1. **Documentation**: Check this guide and API docs
2. **Community**: Join our [Developer Discord](https://discord.gg/mnbara)
3. **Support Tickets**: Create tickets via [Developer Portal](https://mnbara.com/developers/support)
4. **Email**: developers@mnbara.com

### Common Issues

#### Plugin Won't Load
- Check `plugin.json` syntax and required fields
- Verify all dependencies are installed
- Check for TypeScript compilation errors

#### API Endpoints Not Working
- Verify route paths match manifest
- Check authentication and permissions
- Review error logs for details

#### Performance Issues
- Use the built-in profiler: `mnbara-plugin profile`
- Check database query performance
- Implement caching for expensive operations

#### Marketplace Rejection
- Review submission guidelines
- Check for security vulnerabilities
- Ensure comprehensive documentation

### Debug Mode

Enable debug logging:

```bash
export DEBUG=mnbara:plugin:*
mnbara-plugin dev
```

---

## 🎉 What's Next?

1. **Start Building**: Use the CLI to create your first plugin
2. **Join Community**: Connect with other developers
3. **Get Certified**: Take our plugin development certification
4. **Go Premium**: Access advanced features and support

**Happy coding! 🚀**

---

*Last updated: January 2024*  
*Version: 1.0.0*