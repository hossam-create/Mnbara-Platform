# @mnbara/plugin-sdk

SDK for developing Mnbara plugins.

## Installation

```bash
npm install @mnbara/plugin-sdk
```

## Usage

```typescript
import { MnbaraPlugin } from '@mnbara/plugin-sdk';

export default class MyPlugin extends MnbaraPlugin {
  getName() {
    return '@mnbara/my-plugin';
  }

  getVersion() {
    return '1.0.0';
  }

  async initialize() {
    // Register hooks
    this.registerHook('payment.process', this.handlePayment.bind(this));
    
    // Subscribe to events
    this.on('order.created', this.handleOrderCreated.bind(this));
  }

  async handlePayment(data: any) {
    // Process payment
    return { success: true };
  }

  async handleOrderCreated(data: any) {
    this.info('Order created', data);
  }

  async destroy() {
    // Cleanup
  }
}
```

## Documentation

See `/docs` for full documentation.

