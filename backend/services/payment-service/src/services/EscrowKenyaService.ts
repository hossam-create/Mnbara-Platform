import axios from 'axios';
import { Pool } from 'pg';

export interface EscrowKenyaConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  environment: 'sandbox' | 'production';
}

export interface EscrowKenyaTransaction {
  transactionId: string;
  amount: number;
  currency: string;
  buyerId: string;
  sellerId: string;
  description: string;
  status: 'pending' | 'funded' | 'released' | 'refunded' | 'cancelled';
  createdAt: Date;
  fundedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
}

export interface EscrowKenyaPayout {
  payoutId: string;
  sellerId: string;
  amount: number;
  currency: string;
  bankAccount: {
    accountNumber: string;
    bankCode: string;
    accountName: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
}

export class EscrowKenyaService {
  private config: EscrowKenyaConfig;
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.config = {
      apiKey: process.env.ESCROW_KENYA_API_KEY || '',
      apiSecret: process.env.ESCROW_KENYA_API_SECRET || '',
      baseUrl: process.env.ESCROW_KENYA_BASE_URL || 'https://api.escrowkenya.com/v1',
      environment: (process.env.ESCROW_KENYA_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
    };
  }

  /**
   * Create escrow transaction
   */
  async createEscrowTransaction(transactionData: {
    amount: number;
    currency: string;
    buyerId: string;
    sellerId: string;
    description: string;
    orderId: string;
  }): Promise<EscrowKenyaTransaction> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/transactions`,
        {
          amount: transactionData.amount,
          currency: transactionData.currency,
          buyer_id: transactionData.buyerId,
          seller_id: transactionData.sellerId,
          description: transactionData.description,
          order_id: transactionData.orderId,
          callback_url: `${process.env.WEBHOOK_BASE_URL}/api/escrow-kenya/webhook`,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const transaction = response.data;

      // Save to database
      await this.saveTransactionToDb(transaction);

      return transaction;
    } catch (error) {
      console.error('Escrow Kenya create transaction error:', error);
      throw new Error('Failed to create escrow transaction');
    }
  }

  /**
   * Fund escrow transaction
   */
  async fundEscrowTransaction(transactionId: string, paymentMethod: {
    type: 'mpesa' | 'card' | 'bank_transfer';
    details: any;
  }): Promise<EscrowKenyaTransaction> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/transactions/${transactionId}/fund`,
        {
          payment_method: paymentMethod.type,
          payment_details: paymentMethod.details,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const transaction = response.data;

      // Update database
      await this.updateTransactionInDb(transactionId, {
        status: 'funded',
        fundedAt: new Date(),
      });

      return transaction;
    } catch (error) {
      console.error('Escrow Kenya fund transaction error:', error);
      throw new Error('Failed to fund escrow transaction');
    }
  }

  /**
   * Release escrow funds
   */
  async releaseEscrowFunds(transactionId: string, reason?: string): Promise<EscrowKenyaTransaction> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/transactions/${transactionId}/release`,
        {
          reason: reason || 'Order completed successfully',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const transaction = response.data;

      // Update database
      await this.updateTransactionInDb(transactionId, {
        status: 'released',
        releasedAt: new Date(),
      });

      // Trigger payout process
      await this.processPayout(transaction);

      return transaction;
    } catch (error) {
      console.error('Escrow Kenya release funds error:', error);
      throw new Error('Failed to release escrow funds');
    }
  }

  /**
   * Refund escrow transaction
   */
  async refundEscrowTransaction(transactionId: string, reason: string): Promise<EscrowKenyaTransaction> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/transactions/${transactionId}/refund`,
        {
          reason: reason,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const transaction = response.data;

      // Update database
      await this.updateTransactionInDb(transactionId, {
        status: 'refunded',
        refundedAt: new Date(),
      });

      return transaction;
    } catch (error) {
      console.error('Escrow Kenya refund transaction error:', error);
      throw new Error('Failed to refund escrow transaction');
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<EscrowKenyaTransaction> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/transactions/${transactionId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Escrow Kenya get transaction error:', error);
      throw new Error('Failed to get transaction status');
    }
  }

  /**
   * Create payout to seller
   */
  async createPayout(payoutData: {
    sellerId: string;
    amount: number;
    currency: string;
    bankAccount: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    };
    transactionId: string;
  }): Promise<EscrowKenyaPayout> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/payouts`,
        {
          seller_id: payoutData.sellerId,
          amount: payoutData.amount,
          currency: payoutData.currency,
          bank_account: payoutData.bankAccount,
          transaction_id: payoutData.transactionId,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const payout = response.data;

      // Save to database
      await this.savePayoutToDb(payout);

      return payout;
    } catch (error) {
      console.error('Escrow Kenya create payout error:', error);
      throw new Error('Failed to create payout');
    }
  }

  /**
   * Get payout status
   */
  async getPayoutStatus(payoutId: string): Promise<EscrowKenyaPayout> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/payouts/${payoutId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Escrow Kenya get payout error:', error);
      throw new Error('Failed to get payout status');
    }
  }

  /**
   * Process M-Pesa payment
   */
  async processMpesaPayment(paymentData: {
    phoneNumber: string;
    amount: number;
    transactionId: string;
    callbackUrl: string;
  }): Promise<any> {
    try {
      const response = await axios.post(
        `${this.config.baseUrl}/payments/mpesa`,
        {
          phone_number: paymentData.phoneNumber,
          amount: paymentData.amount,
          transaction_id: paymentData.transactionId,
          callback_url: paymentData.callbackUrl,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Escrow Kenya M-Pesa payment error:', error);
      throw new Error('Failed to process M-Pesa payment');
    }
  }

  /**
   * Handle webhook from Escrow Kenya
   */
  async handleWebhook(webhookData: any): Promise<void> {
    try {
      // Verify webhook signature
      const signature = webhookData.signature;
      const payload = JSON.stringify(webhookData.payload);
      
      if (!this.verifyWebhookSignature(signature, payload)) {
        throw new Error('Invalid webhook signature');
      }

      const { event_type, data } = webhookData.payload;

      switch (event_type) {
        case 'transaction.funded':
          await this.handleTransactionFunded(data);
          break;
        case 'transaction.released':
          await this.handleTransactionReleased(data);
          break;
        case 'transaction.refunded':
          await this.handleTransactionRefunded(data);
          break;
        case 'payout.processed':
          await this.handlePayoutProcessed(data);
          break;
        case 'payout.failed':
          await this.handlePayoutFailed(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${event_type}`);
      }
    } catch (error) {
      console.error('Escrow Kenya webhook error:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(signature: string, payload: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Save transaction to database
   */
  private async saveTransactionToDb(transaction: EscrowKenyaTransaction): Promise<void> {
    const query = `
      INSERT INTO escrow_kenya_transactions (
        transaction_id, amount, currency, buyer_id, seller_id,
        description, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (transaction_id) DO UPDATE SET
        status = EXCLUDED.status,
        funded_at = EXCLUDED.funded_at,
        released_at = EXCLUDED.released_at,
        refunded_at = EXCLUDED.refunded_at
    `;

    await this.pool.query(query, [
      transaction.transactionId,
      transaction.amount,
      transaction.currency,
      transaction.buyerId,
      transaction.sellerId,
      transaction.description,
      transaction.status,
      transaction.createdAt,
    ]);
  }

  /**
   * Update transaction in database
   */
  private async updateTransactionInDb(transactionId: string, updates: any): Promise<void> {
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

    const query = `
      UPDATE escrow_kenya_transactions 
      SET ${setClause}, updated_at = NOW()
      WHERE transaction_id = $1
    `;

    await this.pool.query(query, [transactionId, ...values]);
  }

  /**
   * Save payout to database
   */
  private async savePayoutToDb(payout: EscrowKenyaPayout): Promise<void> {
    const query = `
      INSERT INTO escrow_kenya_payouts (
        payout_id, seller_id, amount, currency, bank_account,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (payout_id) DO UPDATE SET
        status = EXCLUDED.status,
        processed_at = EXCLUDED.processed_at
    `;

    await this.pool.query(query, [
      payout.payoutId,
      payout.sellerId,
      payout.amount,
      payout.currency,
      JSON.stringify(payout.bankAccount),
      payout.status,
      payout.createdAt,
    ]);
  }

  /**
   * Handle transaction funded webhook
   */
  private async handleTransactionFunded(data: any): Promise<void> {
    await this.updateTransactionInDb(data.transaction_id, {
      status: 'funded',
      fundedAt: new Date(),
    });

    // Send notification to seller
    console.log(`Transaction ${data.transaction_id} funded`);
  }

  /**
   * Handle transaction released webhook
   */
  private async handleTransactionReleased(data: any): Promise<void> {
    await this.updateTransactionInDb(data.transaction_id, {
      status: 'released',
      releasedAt: new Date(),
    });

    // Send notifications
    console.log(`Transaction ${data.transaction_id} released`);
  }

  /**
   * Handle transaction refunded webhook
   */
  private async handleTransactionRefunded(data: any): Promise<void> {
    await this.updateTransactionInDb(data.transaction_id, {
      status: 'refunded',
      refundedAt: new Date(),
    });

    // Send notifications
    console.log(`Transaction ${data.transaction_id} refunded`);
  }

  /**
   * Handle payout processed webhook
   */
  private async handlePayoutProcessed(data: any): Promise<void> {
    const query = `
      UPDATE escrow_kenya_payouts 
      SET status = 'completed', processed_at = NOW()
      WHERE payout_id = $1
    `;

    await this.pool.query(query, [data.payout_id]);

    // Send notification to seller
    console.log(`Payout ${data.payout_id} processed`);
  }

  /**
   * Handle payout failed webhook
   */
  private async handlePayoutFailed(data: any): Promise<void> {
    const query = `
      UPDATE escrow_kenya_payouts 
      SET status = 'failed', error_message = $2
      WHERE payout_id = $1
    `;

    await this.pool.query(query, [data.payout_id, data.error_message]);

    // Send notification to seller
    console.log(`Payout ${data.payout_id} failed: ${data.error_message}`);
  }

  /**
   * Process payout after transaction release
   */
  private async processPayout(transaction: EscrowKenyaTransaction): Promise<void> {
    // Get seller's bank account
    const bankAccountQuery = `
      SELECT * FROM seller_bank_accounts 
      WHERE seller_id = $1 AND is_default = true
    `;
    const result = await this.pool.query(bankAccountQuery, [transaction.sellerId]);

    if (result.rows[0]) {
      await this.createPayout({
        sellerId: transaction.sellerId,
        amount: transaction.amount,
        currency: transaction.currency,
        bankAccount: result.rows[0],
        transactionId: transaction.transactionId,
      });
    }
  }

  /**
   * Get transaction history for user
   */
  async getUserTransactionHistory(userId: string, role: 'buyer' | 'seller'): Promise<EscrowKenyaTransaction[]> {
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
    
    const query = `
      SELECT * FROM escrow_kenya_transactions 
      WHERE ${column} = $1 
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get payout history for seller
   */
  async getSellerPayoutHistory(sellerId: string): Promise<EscrowKenyaPayout[]> {
    const query = `
      SELECT * FROM escrow_kenya_payouts 
      WHERE seller_id = $1 
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [sellerId]);
    return result.rows;
  }
}
