# MNBARA Plugin System

A comprehensive plugin system for the MNBARA platform that provides extensibility, modularity, and secure plugin management.

## Features

### Core Components

1. **Plugin Loader** - Dynamic plugin discovery, loading, and lifecycle management
2. **Plugin Registry** - Centralized plugin metadata and state management
3. **Plugin Manager** - High-level orchestration of loader and registry
4. **Security** - Permission-based access control and sandboxing
5. **Event System** - Plugin lifecycle events and status tracking

### Key Capabilities

- **Dynamic Loading**: Load/unload plugins at runtime
- **Dependency Management**: Validate plugin dependencies
- **Permission System**: Fine-grained access control
- **Configuration Management**: Per-plugin configuration support
- **Status Tracking**: Real-time plugin status monitoring
- **Backup/Restore**: Registry backup and restoration
- **Event Hooks**: Plugin lifecycle event handling

## Architecture

```
plugin-system/
├── core/
│   ├── plugin-loader/          # Plugin loading and lifecycle
│   ├── plugin-registry/        # Plugin metadata and state management
│   ├── hooks-system/           # Event hook system (Phase 2)
│   ├── event-bus/              # Centralized event handling (Phase 2)
│   └── security/               # Security and sandboxing
├── marketplace/
│   ├── api/                    # Marketplace API (Phase 2)
│   └── web-ui/                 # Marketplace web interface (Phase 2)
├── packages/
│   └── plugin-sdk/             # Plugin development SDK (Phase 2)
├── plugins/
│   └── official/               # Official plugin examples
│       ├── stripe-payment/
│       ├── google-analytics/
│       └── mailchimp-integration/
└── tests/                      # Comprehensive test suite
```

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Basic Usage

```typescript
import { PluginManager } from '@mnbara/plugin-system';

const pluginManager = new PluginManager({
  pluginsDirectory: './plugins',
  registryPath: './data/plugin-registry.json',
  allowedPermissions: ['payment.process', 'analytics.read'],
  autoLoad: true,
  autoEnable: true
});

// Initialize
await pluginManager.initialize();

// Get plugin statistics
const stats = pluginManager.getStats();
console.log('Plugin Stats:', stats);

// List all plugins
const plugins = pluginManager.getAllPlugins();
plugins.loaded.forEach(plugin => {
  console.log(`${plugin.manifest.metadata.name} - ${plugin.manifest.metadata.version}`);
});
```

### Plugin Development

Create a plugin with a `plugin.json` manifest:

```json
{
  "metadata": {
    "id": "my-plugin",
    "name": "My Plugin",
    "version": "1.0.0",
    "description": "A sample plugin",
    "author": "Your Name",
    "main": "index.js",
    "permissions": ["user.read", "email.send"],
    "hooks": ["user:onSignup", "email:beforeSend"],
    "config": {
      "apiKey": "",
      "debugMode": false
    }
  },
  "entry": "index.js",
  "enabled": true,
  "installedAt": "2024-01-01T00:00:00.000Z"
}
```

Create the plugin implementation:

```javascript
// index.js
class MyPlugin {
  constructor() {
    this.name = 'My Plugin';
  }

  async init({ config, permissions }) {
    console.log('Plugin initialized with config:', config);
    console.log('Granted permissions:', permissions);
  }

  async destroy() {
    console.log('Plugin destroyed');
  }

  // Hook handlers
  async onUserSignup(user) {
    console.log('New user signed up:', user.email);
  }

  async onBeforeSendEmail(email) {
    console.log('About to send email:', email.subject);
  }
}

module.exports = MyPlugin;
```

## Plugin Lifecycle

1. **Discovery**: Plugin manifests are discovered in the plugins directory
2. **Registration**: Plugins are registered in the registry with metadata
3. **Loading**: Plugin modules are loaded and instantiated
4. **Initialization**: Plugin `init()` method is called with configuration
5. **Enablement**: Plugins can be enabled/disabled at runtime
6. **Hook Registration**: Plugins register for event hooks
7. **Operation**: Plugins process events and perform their functions
8. **Disablement**: Plugins can be disabled without unloading
9. **Destruction**: Plugin `destroy()` method is called
10. **Unloading**: Plugin modules are unloaded from memory

## Configuration

### Plugin Manager Configuration

```typescript
interface PluginManagerConfig {
  pluginsDirectory: string;        // Directory containing plugins
  registryPath: string;            // Path to plugin registry file
  allowedPermissions?: string[];   // Whitelist of allowed permissions
  autoLoad?: boolean;              // Auto-load plugins on startup
  autoEnable?: boolean;            // Auto-enable loaded plugins
  sandbox?: boolean;               // Enable plugin sandboxing
}
```

### Plugin Manifest Structure

```typescript
interface PluginMetadata {
  id: string;                      // Unique plugin identifier
  name: string;                    // Human-readable name
  version: string;                   // Semantic version
  description?: string;            // Plugin description
  author?: string;                   // Plugin author
  main: string;                      // Entry point file
  dependencies?: Record<string, string>; // NPM dependencies
  permissions?: string[];            // Required permissions
  hooks?: string[];                  // Event hooks to register
  config?: Record<string, any>;      // Default configuration
}
```

## Security

### Permission System

Plugins must declare required permissions in their manifest:

- **payment.process**: Process payments
- **payment.refund**: Process refunds
- **analytics.read**: Read analytics data
- **analytics.write**: Write analytics data
- **email.send**: Send emails
- **user.read**: Read user data
- **user.write**: Modify user data
- **transaction.write**: Create/modify transactions

### Sandboxing

When sandboxing is enabled:
- Plugins run in isolated contexts
- Access to Node.js APIs is restricted
- File system access is limited
- Network access requires permissions
- Global object modifications are prevented

## Events

### Plugin Lifecycle Events

- `plugin:loading` - Plugin is being loaded
- `plugin:loaded` - Plugin successfully loaded
- `plugin:unloading` - Plugin is being unloaded
- `plugin:unloaded` - Plugin successfully unloaded
- `plugin:enabled` - Plugin was enabled
- `plugin:disabled` - Plugin was disabled
- `plugin:error` - Plugin encountered an error

### Registry Events

- `registry:registered` - Plugin registered in registry
- `registry:updated` - Plugin metadata updated
- `registry:unregistered` - Plugin removed from registry
- `registry:status-updated` - Plugin status changed
- `registry:enabled` - Plugin enabled in registry
- `registry:disabled` - Plugin disabled in registry

### Manager Events

- `manager:initialized` - Plugin manager initialized
- `manager:installed` - Plugin installed
- `manager:uninstalled` - Plugin uninstalled
- `manager:enabled` - Plugin enabled
- `manager:disabled` - Plugin disabled
- `manager:error` - Manager encountered an error

## Development Roadmap

### Phase 1 (Current)
- ✅ Plugin Loader & Registry
- ✅ Plugin Manager
- ✅ Basic security and permissions
- ✅ Event system foundation
- 🔄 Hook System (in progress)
- 🔄 Plugin SDK (in progress)

### Phase 2
- Advanced hook system with filtering
- Plugin marketplace API
- Plugin marketplace web UI
- Plugin dependency resolution
- Plugin version management

### Phase 3
- Advanced security features
- Plugin performance monitoring
- Plugin resource limits
- Hot reloading capabilities
- Plugin testing framework

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details