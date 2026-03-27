// Simple test to verify plugin SDK compilation works
const { PluginSDK } = require('./dist/PluginSDK');

console.log('Testing PluginSDK compilation...');

try {
  // Test basic plugin creation
  const plugin = new PluginSDK({
    metadata: {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: 'Test Author'
    },
    manifest: {
      metadata: {
        id: 'test-plugin',
        name: 'Test Plugin',
        description: 'A test plugin',
        author: 'Test Author'
      },
      entry: 'dist/index.js',
      enabled: true,
      permissions: {
        wallet: { read: false, write: false, sign: false, admin: false },
        api: { external: false, internal: true, admin: false },
        ui: { render: true, modify: false, admin: false },
        hooks: { register: true, trigger: true, admin: false },
        storage: { read: true, write: true, admin: false },
        system: { network: false, filesystem: false, process: false, admin: false }
      },
      configuration: {
        settings: {},
        features: {
          typescript: true,
          hooks: false,
          walletIntegration: false,
          uiComponents: false,
          apiEndpoints: false,
          storage: true,
          cache: false,
          metrics: true
        },
        development: { hotReload: true, debug: true, mockData: false },
        production: { minify: true, optimize: true, compress: true }
      }
    }
  });

  console.log('✅ PluginSDK instantiation successful');
  console.log('✅ Plugin compilation test passed');
} catch (error) {
  console.error('❌ Plugin compilation test failed:', error.message);
  process.exit(1);
}