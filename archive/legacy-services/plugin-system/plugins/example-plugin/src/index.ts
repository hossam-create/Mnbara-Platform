// Example Plugin - Demonstrates plugin system usage
import { MnbaraPlugin } from '@mnbara/plugin-sdk';

export default class ExamplePlugin extends MnbaraPlugin {
  getName() {
    return '@mnbara/example-plugin';
  }

  getVersion() {
    return '1.0.0';
  }

  async initialize() {
    this.info('Example plugin initializing...');

    // Get config
    const message = this.getConfig<string>('message', 'Hello from example plugin!');
    this.info(message);

    // Register a hook
    this.registerHook('example.hook', this.handleExampleHook.bind(this), 100);

    // Subscribe to events
    this.on('order.created', this.handleOrderCreated.bind(this));

    // Emit initialization event
    this.emit('plugin.initialized', {
      pluginName: this.getName(),
      version: this.getVersion()
    });

    this.info('Example plugin initialized successfully');
  }

  async handleExampleHook(data: any) {
    this.debug('Example hook executed', data);
    return {
      ...data,
      processedBy: this.getName(),
      timestamp: new Date()
    };
  }

  async handleOrderCreated(data: any) {
    this.info('Order created event received', data);
  }

  async destroy() {
    this.info('Example plugin destroying...');
    // Cleanup code here
    this.info('Example plugin destroyed');
  }
}

