# {{PluginName}}

A live streaming plugin for eBay Live that provides real-time stream management, viewer interaction, and chat functionality.

## Features

- 🎥 **Live Stream Management**: Start, stop, and monitor live streams
- 👥 **Viewer Tracking**: Track viewer count and interactions
- 💬 **Chat Integration**: Real-time chat with message filtering and moderation
- 📊 **Quality Control**: Dynamic stream quality adjustment
- 🔒 **Security**: Permission-based access control
- 📈 **Analytics**: Stream performance metrics

## Installation

```bash
npm install
npm run build
```

## Configuration

Configure the plugin in your `plugin-workspace.json`:

```json
{
  "plugins": [
    {
      "name": "{{pluginName}}",
      "enabled": true,
      "config": {
        "streamUrl": "https://your-stream-server.com",
        "chatEnabled": true,
        "maxViewers": 1000,
        "streamQuality": "720p"
      }
    }
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `streamUrl` | string | - | URL of the streaming server |
| `chatEnabled` | boolean | true | Enable/disable chat functionality |
| `maxViewers` | number | 1000 | Maximum number of concurrent viewers |
| `streamQuality` | string | "720p" | Default stream quality |

## Usage

### Basic Usage

```typescript
import { {{PluginName}} } from '{{pluginName}}';

const plugin = new {{PluginName}}(context);
await plugin.initialize();

// Get active streams
const activeStreams = plugin.getActiveStreams();
console.log(`Active streams: ${activeStreams.length}`);

// Check if stream is active
const isActive = plugin.isStreamActive('stream-123');
console.log(`Stream active: ${isActive}`);
```

### Hook Handlers

The plugin provides several hook handlers for stream events:

```typescript
// Handle stream start
plugin.onStreamStart({
  streamId: 'stream-123',
  title: 'My Live Stream',
  viewerCount: 0
});

// Handle chat messages
plugin.onChatMessage({
  streamId: 'stream-123',
  message: {
    id: 'msg-456',
    content: 'Hello everyone!',
    author: 'viewer123',
    timestamp: new Date()
  }
});
```

## API Reference

### Methods

#### `initialize(): Promise<void>`
Initialize the plugin and set up event listeners.

#### `destroy(): Promise<void>`
Clean up resources and stop all active streams.

#### `getActiveStreams(): StreamEvent[]`
Get all currently active streams.

#### `getStream(streamId: string): StreamEvent | undefined`
Get a specific stream by ID.

#### `isStreamActive(streamId: string): boolean`
Check if a stream is currently active.

#### `getInfo(): any`
Get plugin information including active stream count and configuration.

### Events

#### Stream Events

- `stream:start` - Fired when a stream starts
- `stream:stop` - Fired when a stream stops
- `stream:viewer-joined` - Fired when a viewer joins a stream
- `stream:viewer-left` - Fired when a viewer leaves a stream
- `stream:quality-changed` - Fired when stream quality changes

#### Chat Events

- `stream:chat-message` - Fired when a chat message is received

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Development Server

```bash
npm run dev
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Examples

### Creating a Stream

```typescript
// Start a new stream
await plugin.onStreamStart({
  streamId: 'my-stream-123',
  title: 'Product Demo Live',
  description: 'Live demonstration of our latest products',
  viewerCount: 0,
  quality: '1080p',
  duration: 0
});
```

### Managing Chat

```typescript
// Process incoming chat messages
plugin.onChatMessage({
  streamId: 'my-stream-123',
  message: {
    id: 'chat-789',
    content: 'What is the price?',
    author: 'customer456',
    timestamp: new Date()
  }
});
```

### Quality Management

```typescript
// Change stream quality
plugin.onQualityChanged({
  streamId: 'my-stream-123',
  quality: '720p'
});
```

## Permissions

The plugin requires the following permissions:

- `stream:read` - Read stream information
- `stream:write` - Start/stop streams
- `chat:read` - Read chat messages
- `chat:write` - Send chat messages

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- GitHub Issues: [Report bugs and feature requests]
- Documentation: [Full API documentation]
- Community: [Join our Discord server]