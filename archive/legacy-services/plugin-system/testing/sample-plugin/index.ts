import { MnbaraPlugin } from '@mnbara/plugin-sdk';

export class SampleTestPlugin extends MnbaraPlugin {
  name = 'sample-test-plugin';
  version = '1.0.0';
  description = 'A sample plugin for testing the framework';

  async initialize() {
    console.log('Sample test plugin initialized');
    return true;
  }

  async processPayment(data: any) {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!data.amount || data.amount <= 0) {
      throw new Error('Invalid payment amount');
    }

    return {
      success: true,
      transactionId: `txn_${Date.now()}`,
      amount: data.amount,
      currency: data.currency || 'USD'
    };
  }

  async processRefund(data: any) {
    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 150));
    
    if (!data.transactionId) {
      throw new Error('Transaction ID required for refund');
    }

    return {
      success: true,
      refundId: `ref_${Date.now()}`,
      originalTransactionId: data.transactionId,
      amount: data.amount
    };
  }

  async cleanup() {
    console.log('Sample test plugin cleanup completed');
  }
}

export default SampleTestPlugin;