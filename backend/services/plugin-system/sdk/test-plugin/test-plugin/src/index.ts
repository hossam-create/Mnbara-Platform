import { PluginSDK, PluginConfig } from '@mnbara/plugin-sdk';

// Plugin configuration
const config: PluginConfig = {
  metadata: {
    id: 'test-plugin',
    name: 'test-plugin',
    version: '1.0.0',
    description: 'A MNBara plugin',
    author: 'Your Name'
  },
  manifest: require('../plugin.manifest.json')
};

// Initialize plugin
const plugin = new PluginSDK(config);

// Main plugin function
export async function main(): Promise<void> {
  await plugin.initialize();
  const context = plugin.getContext();
  
  context.log('info', 'test-plugin plugin started');
  
  // Plugin logic here
  context.log('info', 'test-plugin plugin logic executed');
}









// Export plugin instance
export default plugin;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
