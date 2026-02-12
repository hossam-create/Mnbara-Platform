# MNBara Plugin SDK Documentation

## Overview

The MNBara Plugin SDK provides a comprehensive framework for developing plugins that integrate with the unified wallet service. This SDK enables third-party developers to create secure, sandboxed plugins that can extend the functionality of the wallet system.

## Quick Start

### Installation

```bash
npm install @mnbara/plugin-sdk
```

### Basic Plugin Structure

```typescript
import { PluginBuilder, PluginManifest } from '@mnbara/plugin-sdk';

const manifest: PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom wallet plugin',
  author: 'Your Name',
  category: 'payment',
  hooks: ['transaction:completed', 'wallet:created'],
  permissions: ['read:wallets', 'read:transactions'],
};

const plugin = new PluginBuilder(manifest)
  .onHook('transaction:completed', async (transactionData) => {
    console.log('Transaction completed:', transactionData);
    // Your custom logic here
  })
  .onHook('wallet:created', async (walletData) => {
    console.log('Wallet created:', walletData);
    // Your custom logic here
  })
  .build();

export default plugin;
```

## Core Concepts

### 1. Plugin Manifest

The plugin manifest defines your plugin's metadata and capabilities:

```typescript
interface PluginManifest {
  name: string;                    // Unique plugin identifier
  version: string;                // Semantic version
  description: string;            // Plugin description
  author: string;                 // Author name
  category: PluginCategory;       // payment, analytics, email, etc.
  hooks: string[];                // Hooks your plugin listens to
  permissions: Permission[];        // Required permissions
  dependencies?: string[];         // Plugin dependencies
  config?: Record<string, any>;   // Default configuration
}
```

### 2. Available Hooks

The unified wallet service provides the following hooks:

#### Wallet Hooks
- `wallet:created` - Fired when a new wallet is created
- `wallet:updated` - Fired when wallet details are updated
- `wallet:deleted` - Fired when a wallet is deleted

#### Transaction Hooks
- `transaction:initiated` - Fired when a transaction is initiated
- `transaction:completed` - Fired when a transaction is completed
- `transaction:failed` - Fired when a transaction fails
- `transaction:refunded` - Fired when a transaction is refunded

#### Payout Hooks
- `payout:created` - Fired when a payout is created
- `payout:processed` - Fired when a payout is processed
- `payout:failed` - Fired when a payout fails

#### KYC Hooks
- `kyc:submitted` - Fired when KYC is submitted
- `kyc:approved` - Fired when KYC is approved
- `kyc:rejected` - Fired when KYC is rejected

#### Exchange Hooks
- `exchange:rate_updated` - Fired when exchange rates are updated

#### Settlement Hooks
- `settlement:initiated` - Fired when settlement is initiated
- `settlement:completed` - Fired when settlement is completed
- `settlement:failed` - Fired when settlement fails

#### System Hooks
- `system:maintenance` - Fired during system maintenance
- `system:alert` - Fired for system alerts

### 3. Permissions

Available permissions for plugins:

```typescript
type Permission = 
  | 'read:wallets'           // Read wallet information
  | 'write:wallets'          // Create/update wallets
  | 'read:transactions'      // Read transaction history
  | 'write:transactions'     // Create transactions
  | 'read:payouts'          // Read payout information
  | 'write:payouts'         // Create payouts
  | 'read:kyc'               // Read KYC data
  | 'write:kyc'              // Update KYC status
  | 'read:exchange'           // Read exchange rates
  | 'read:settlements'       // Read settlement data
  | 'admin:plugins'          // Manage plugins (admin only)
```

## Plugin Builder API

### Basic Usage

```typescript
import { PluginBuilder } from '@mnbara/plugin-sdk';

const plugin = new PluginBuilder(manifest)
  .onHook('transaction:completed', async (data) => {
    // Handle transaction completion
  })
  .onHook('wallet:created', async (data) => {
    // Handle wallet creation
  })
  .build();
```

### Advanced Features

#### Configuration Management

```typescript
const plugin = new PluginBuilder(manifest)
  .onConfigUpdate(async (newConfig, oldConfig) => {
    console.log('Configuration updated:', newConfig);
  })
  .build();
```

#### API Requests

```typescript
const plugin = new PluginBuilder(manifest)
  .onHook('transaction:completed', async (data) => {
    // Make API request to external service
    const response = await plugin.api.request({
      url: 'https://api.example.com/webhook',
      method: 'POST',
      data: {
        transactionId: data.id,
        amount: data.amount,
        currency: data.currency,
      },
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Webhook response:', response);
  })
  .build();
```

#### Database Access

```typescript
const plugin = new PluginBuilder(manifest)
  .onHook('wallet:created', async (walletData) => {
    // Store custom data in plugin database
    await plugin.db.query({
      sql: 'INSERT INTO custom_wallet_data (wallet_id, custom_field) VALUES (?, ?)',
      params: [walletData.id, 'custom_value'],
    });
  })
  .build();
```

#### Logging

```typescript
const plugin = new PluginBuilder(manifest)
  .onHook('transaction:completed', async (data) => {
    plugin.logger.info('Transaction completed', { transactionId: data.id });
    plugin.logger.debug('Transaction details', data);
    plugin.logger.warn('Low balance warning', { balance: data.balance });
    plugin.logger.error('Transaction processing failed', new Error('Processing error'));
  })
  .build();
```

## Plugin Categories

### Payment Plugins

Payment plugins handle payment processing and integrations:

```typescript
const paymentPlugin = new PluginBuilder({
  name: 'stripe-payment',
  version: '1.0.0',
  description: 'Stripe payment integration',
  author: 'MNBara Team',
  category: 'payment',
  hooks: ['transaction:initiated'],
  permissions: ['read:transactions', 'write:transactions'],
})
  .onHook('transaction:initiated', async (transaction) => {
    // Process payment with Stripe
    const paymentIntent = await processStripePayment(transaction);
    
    if (paymentIntent.status === 'succeeded') {
      plugin.logger.info('Stripe payment successful', { 
        transactionId: transaction.id,
        paymentIntentId: paymentIntent.id,
      });
    }
  })
  .build();
```

### Analytics Plugins

Analytics plugins collect and analyze data:

```typescript
const analyticsPlugin = new PluginBuilder({
  name: 'transaction-analytics',
  version: '1.0.0',
  description: 'Transaction analytics and reporting',
  author: 'MNBara Team',
  category: 'analytics',
  hooks: ['transaction:completed', 'transaction:failed'],
  permissions: ['read:transactions'],
})
  .onHook('transaction:completed', async (transaction) => {
    // Track successful transaction
    await plugin.analytics.track('transaction_completed', {
      transactionId: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: new Date(),
    });
  })
  .onHook('transaction:failed', async (transaction) => {
    // Track failed transaction
    await plugin.analytics.track('transaction_failed', {
      transactionId: transaction.id,
      amount: transaction.amount,
      failureReason: transaction.failureReason,
      timestamp: new Date(),
    });
  })
  .build();
```

### Email Plugins

Email plugins handle notifications and communications:

```typescript
const emailPlugin = new PluginBuilder({
  name: 'email-notifications',
  version: '1.0.0',
  description: 'Email notification system',
  author: 'MNBara Team',
  category: 'email',
  hooks: ['transaction:completed', 'kyc:approved', 'kyc:rejected'],
  permissions: ['read:transactions', 'read:kyc'],
})
  .onHook('transaction:completed', async (transaction) => {
    // Send transaction confirmation email
    await plugin.email.send({
      to: transaction.userEmail,
      subject: 'Transaction Completed',
      template: 'transaction_completed',
      data: {
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        timestamp: transaction.completedAt,
      },
    });
  })
  .onHook('kyc:approved', async (kycData) => {
    // Send KYC approval email
    await plugin.email.send({
      to: kycData.userEmail,
      subject: 'KYC Verification Approved',
      template: 'kyc_approved',
      data: {
        userName: kycData.userName,
        approvedAt: kycData.approvedAt,
      },
    });
  })
  .build();
```

## Security and Sandboxing

### Module Restrictions

Plugins run in a sandboxed environment with restricted module access:

**Allowed Modules:**
- `crypto` - Cryptographic functions
- `util` - Utility functions
- `url` - URL parsing and formatting
- `querystring` - Query string parsing
- `path` - File path utilities
- `fs` - File system operations (read-only)
- `os` - Operating system information
- `stream` - Stream utilities
- `buffer` - Buffer manipulation
- `events` - Event handling
- `timers` - Timer functions
- `process` - Process information (read-only)

**Restricted Modules:**
- `child_process` - Process spawning
- `cluster` - Cluster management
- `dgram` - UDP/datagram sockets
- `dns` - DNS resolution
- `http2` - HTTP/2 protocol
- `https` - HTTPS protocol
- `net` - Network sockets
- `tls` - TLS/SSL protocol
- `vm` - Virtual machine
- `zlib` - Compression
- `v8` - V8 engine access
- `inspector` - V8 inspector

### Permission System

Plugins must declare required permissions in their manifest:

```typescript
const manifest: PluginManifest = {
  name: 'my-plugin',
  version: '1.0.0',
  permissions: [
    'read:wallets',
    'read:transactions',
    'write:transactions',
  ],
  // ... other properties
};
```

### API Rate Limiting

All external API requests made by plugins are rate-limited:

- 100 requests per minute per plugin
- 1000 requests per hour per plugin
- 10000 requests per day per plugin

## Testing Your Plugin

### Unit Testing

```typescript
import { PluginBuilder } from '@mnbara/plugin-sdk';
import { createMockTransaction } from '@mnbara/plugin-sdk/test-utils';

describe('My Plugin', () => {
  it('should handle transaction completion', async () => {
    const plugin = new PluginBuilder(manifest)
      .onHook('transaction:completed', async (data) => {
        // Your test logic
      })
      .build();

    const mockTransaction = createMockTransaction({
      id: 'test-transaction-123',
      amount: 100,
      currency: 'USD',
      status: 'completed',
    });

    await plugin.hooks.execute('transaction:completed', mockTransaction);
    // Add your assertions here
  });
});
```

### Integration Testing

```typescript
import { PluginTestHarness } from '@mnbara/plugin-sdk/test-utils';

describe('My Plugin Integration', () => {
  let harness: PluginTestHarness;

  beforeEach(() => {
    harness = new PluginTestHarness();
  });

  it('should integrate with wallet service', async () => {
    const plugin = new PluginBuilder(manifest)
      .onHook('wallet:created', async (data) => {
        // Your integration logic
      })
      .build();

    await harness.loadPlugin(plugin);
    
    const walletData = {
      id: 'test-wallet-123',
      userId: 'test-user-456',
      currency: 'USD',
      balance: 1000,
    };

    await harness.triggerHook('wallet:created', walletData);
    // Add your assertions here
  });
});
```

## Deployment

### Packaging Your Plugin

```bash
# Build your plugin
npm run build

# Package for distribution
npm run package

# This creates a .plugin file that can be installed
# my-plugin-v1.0.0.plugin
```

### Installation

Plugins can be installed via:

1. **Marketplace**: Browse and install from the plugin marketplace
2. **Direct Upload**: Upload .plugin files through the admin interface
3. **API**: Install programmatically via the plugin API

### Configuration

Plugins can be configured after installation:

```json
{
  "apiKey": "your-api-key",
  "webhookUrl": "https://your-domain.com/webhook",
  "enabledFeatures": ["feature1", "feature2"],
  "debugMode": false
}
```

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
const plugin = new PluginBuilder(manifest)
  .onHook('transaction:completed', async (data) => {
    try {
      // Your logic here
      await processTransaction(data);
    } catch (error) {
      plugin.logger.error('Failed to process transaction', {
        transactionId: data.id,
        error: error.message,
      });
      
      // Don't throw - let other plugins continue
      return { success: false, error: error.message };
    }
  })
  .build();
```

### 2. Performance

Keep your plugin lightweight:

```typescript
const plugin = new PluginBuilder(manifest)
  .onHook('transaction:completed', async (data) => {
    // Use async operations
    await Promise.all([
      updateAnalytics(data),
      sendNotification(data),
      syncExternalSystem(data),
    ]);
  })
  .build();
```

### 3. Security

Never expose sensitive data:

```typescript
const plugin = new PluginBuilder(manifest)
  .onHook('transaction:completed', async (data) => {
    // Log only necessary information
    plugin.logger.info('Transaction processed', {
      transactionId: data.id,
      amount: data.amount,
      // Don't log: userId, walletId, personal data
    });
  })
  .build();
```

### 4. Configuration Validation

Validate configuration on startup:

```typescript
const plugin = new PluginBuilder(manifest)
  .onInit(async (config) => {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    
    if (!config.webhookUrl || !isValidUrl(config.webhookUrl)) {
      throw new Error('Valid webhook URL is required');
    }
    
    plugin.logger.info('Plugin initialized successfully');
  })
  .build();
```

## Troubleshooting

### Common Issues

1. **Plugin not loading**: Check manifest syntax and file permissions
2. **Hook not firing**: Verify hook name and plugin activation status
3. **Permission denied**: Ensure required permissions are declared in manifest
4. **API request failing**: Check rate limits and network connectivity
5. **Database errors**: Verify plugin database permissions

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const plugin = new PluginBuilder({
  ...manifest,
  debug: true, // Enable debug mode
})
  .onHook('transaction:completed', async (data) => {
    plugin.logger.debug('Transaction data received', data);
  })
  .build();
```

### Support

For additional support:

- Check the [Plugin SDK GitHub Repository](https://github.com/mnbara/plugin-sdk)
- Visit the [Developer Documentation](https://docs.mnbara.com/plugins)
- Join the [Developer Community](https://community.mnbara.com)
- Contact support at plugins@mnbara.com

## Version History

### v1.0.0 (Current)
- Initial release
- Basic plugin framework
- Hook system
- Security sandboxing
- Marketplace integration
- Configuration management

### Roadmap
- v1.1.0 - Enhanced analytics and monitoring
- v1.2.0 - Advanced security features
- v1.3.0 - Plugin collaboration framework
- v2.0.0 - Major API improvements

## License

This SDK is licensed under the MIT License. See LICENSE file for details.

---

**Happy Plugin Development!** 🚀

For the latest updates and features, follow us on [Twitter](https://twitter.com/mnbara) and [GitHub](https://github.com/mnbara).