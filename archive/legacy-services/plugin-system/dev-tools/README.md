# Plugin Developer Tools

Development tools for creating, testing, and managing plugins for the eBay Live Crafter platform.

## Features

- **Plugin Scaffolding**: Create new plugins from templates
- **Template Management**: Pre-built templates for common plugin types
- **CLI Interface**: Command-line tools for plugin development
- **Code Generation**: Generate boilerplate code for plugins

## Installation

```bash
cd backend/services/plugin-system/dev-tools
npm install
npm run build
```

## CLI Usage

### Create a new plugin

```bash
node dist/simple-plugin-dev.js create my-plugin --template live-streaming
```

### List available templates

```bash
node dist/simple-plugin-dev.js list-templates
```

### Show help

```bash
node dist/simple-plugin-dev.js help
```

## Available Templates

### Live Streaming Template

Creates a plugin for handling live streaming functionality with:
- Stream event handlers (start, stop, viewer management)
- Chat integration
- Quality management
- Viewer limits and controls

### Marketplace Template

Creates a plugin for marketplace operations with:
- Product listing management
- Order processing
- Review system
- Commission calculations

## Template Structure

Each template includes:
- `manifest.json` - Plugin configuration and metadata
- `index.ts` - Main plugin implementation
- `package.json` - Dependencies and scripts
- `README.md` - Documentation

## Plugin Development Workflow

1. **Create Plugin**: Use CLI to scaffold a new plugin
2. **Install Dependencies**: Run `npm install` in the plugin directory
3. **Develop**: Implement your plugin logic
4. **Test**: Use the testing framework to validate your plugin
5. **Build**: Compile your plugin with `npm run build`
6. **Deploy**: Package and deploy your plugin

## Template Variables

Templates support the following variables that get replaced during scaffolding:

- `{{pluginName}}` - Plugin name (kebab-case)
- `{{PluginName}}` - Plugin name (PascalCase)
- `{{author}}` - Plugin author
- `{{description}}` - Plugin description
- `{{currentDate}}` - Current date (ISO format)

## Example Plugin Creation

```bash
# Create a live streaming plugin
node dist/simple-plugin-dev.js create my-live-stream --template live-streaming

# Navigate to the created plugin
cd my-live-stream

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Next Steps

- Add more templates (analytics, payment, shipping, etc.)
- Implement plugin testing integration
- Add deployment and packaging features
- Create plugin marketplace integration
- Add development server for live testing