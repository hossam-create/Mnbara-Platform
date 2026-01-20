import { Pool } from 'pg';
import Stripe from 'stripe';

export interface PayoutRecord {
  sellerId: string;
  amountCents: number;
  currency: string;
  bankAccountId: string;
  metadata?: Record<string, string>;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  status: 'pending' | 'verified' | 'failed';
  stripeAccountId?: string;
  stripeExternalAccountId?: string;
}

export interface PayoutBatch {
  id: string;
  totalAmountCents: number;
  totalFeesCents: number;
  payoutCount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processedAt?: Date;
  createdAt: Date;
}

export class PayoutService {
  private pool: Pool;
  private stripe: Stripe;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * Add bank account for seller
   */
  async addBankAccount(bankAccount: Omit<BankAccount, 'id' | 'status'>): Promise<BankAccount> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create or get Stripe Connect account for seller
      const stripeAccount = await this.getOrCreateStripeAccount(bankAccount.userId);

      // Add external bank account to Stripe
      const externalAccount = await this.stripe.accounts.createExternalAccount(
        stripeAccount.id,
        {
          external_account: {
            object: 'bank_account',
            country: 'US',
            currency: 'usd',
            account_holder_name: bankAccount.accountHolderName,
            account_number: bankAccount.accountNumber,
            routing_number: bankAccount.routingNumber,
          },
        }
      );

      // Insert bank account record
      const query = `
        INSERT INTO bank_accounts (
          user_id, account_holder_name, account_number, routing_number,
          bank_name, account_type, status, stripe_account_id, stripe_external_account_id
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
        RETURNING *
      `;

      const values = [
        bankAccount.userId,
        bankAccount.accountHolderName,
        bankAccount.accountNumber.slice(-4), // Store last 4 digits only
        bankAccount.routingNumber,
        bankAccount.bankName,
        bankAccount.accountType,
        stripeAccount.id,
        externalAccount.id,
      ];

      const result = await client.query(query, values);
      const savedAccount = result.rows[0];

      await client.query('COMMIT');

      // Trigger verification micro-deposits
      await this.stripe.accounts.createExternalAccount(stripeAccount.id, {
        external_account: externalAccount.id,
      });

      return savedAccount;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get or create Stripe Connect account for seller
   */
  private async getOrCreateStripeAccount(userId: string): Promise<Stripe.Account> {
    // Check if account exists
    const existingQuery = `
      SELECT stripe_account_id FROM seller_stripe_accounts WHERE user_id = $1
    `;
    const existingResult = await this.pool.query(existingQuery, [userId]);

    if (existingResult.rows[0]) {
      return await this.stripe.accounts.retrieve(existingResult.rows[0].stripe_account_id);
    }

    // Create new Connect account
    const userQuery = `
      SELECT email, full_name FROM users WHERE id = $1
    `;
    const userResult = await this.pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    const account = await this.stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: user.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      individual: {
        email: user.email,
        full_name: user.full_name,
      },
    });

    // Save account reference
    const insertQuery = `
      INSERT INTO seller_stripe_accounts (user_id, stripe_account_id, status)
      VALUES ($1, $2, 'pending')
    `;
    await this.pool.query(insertQuery, [userId, account.id]);

    return account;
  }

  /**
   * Calculate available balance for seller
   */
  async getAvailableBalance(sellerId: string): Promise<number> {
    const query = `
      SELECT 
        COALESCE(SUM(seller_amount_cents), 0) as total_earned,
        COALESCE(SUM(CASE WHEN p.status = 'succeeded' AND p.completed_at > NOW() - INTERVAL '7 days' 
                     THEN seller_amount_cents ELSE 0 END), 0) as pending_clearance,
        COALESCE(SUM(CASE WHEN p.status = 'succeeded' AND p.completed_at <= NOW() - INTERVAL '7 days' 
                     AND NOT EXISTS (SELECT 1 FROM payouts WHERE payment_id = p.id) 
                     THEN seller_amount_cents ELSE 0 END), 0) as available
      FROM payments p
      WHERE p.seller_id = $1 AND p.status = 'succeeded'
    `;

    const result = await this.pool.query(query, [sellerId]);
    return result.rows[0].available || 0;
  }

  /**
   * Create payout for seller
   */
  async createPayout(sellerId: string, amountCents: number, bankAccountId: string): Promise<any> {
    const availableBalance = await this.getAvailableBalance(sellerId);

    if (amountCents > availableBalance) {
      throw new Error('Insufficient available balance');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get bank account
      const bankAccountQuery = `
        SELECT * FROM bank_accounts WHERE id = $1 AND user_id = $2 AND status = 'verified'
      `;
      const bankAccountResult = await client.query(bankAccountQuery, [bankAccountId, sellerId]);
      const bankAccount = bankAccountResult.rows[0];

      if (!bankAccount) {
        throw new Error('Bank account not found or not verified');
      }

      // Get Stripe account
      const stripeAccountQuery = `
        SELECT stripe_account_id FROM seller_stripe_accounts WHERE user_id = $1 AND status = 'active'
      `;
      const stripeAccountResult = await client.query(stripeAccountQuery, [sellerId]);
      const stripeAccountId = stripeAccountResult.rows[0]?.stripe_account_id;

      if (!stripeAccountId) {
        throw new Error('Seller Stripe account not active');
      }

      // Calculate fee (1% or $1 minimum)
      const feeCents = Math.max(amountCents * 0.01, 100);
      const netAmountCents = amountCents - feeCents;

      // Create payout record
      const payoutQuery = `
        INSERT INTO payouts (
          seller_id, bank_account_id, amount_cents, fee_cents, net_amount_cents,
          status, currency, stripe_account_id
        ) VALUES ($1, $2, $3, $4, $5, 'pending', 'usd', $6)
        RETURNING *
      `;

      const payoutResult = await client.query(payoutQuery, [
        sellerId,
        bankAccountId,
        amountCents,
        feeCents,
        netAmountCents,
        stripeAccountId,
      ]);

      const payout = payoutResult.rows[0];

      // Create Stripe transfer
      const transfer = await this.stripe.transfers.create({
        amount: netAmountCents,
        currency: 'usd',
        destination: stripeAccountId,
        transfer_group: `payout_${payout.id}`,
        metadata: {
          payout_id: payout.id,
          seller_id: sellerId,
        },
      });

      // Update payout with Stripe transfer ID
      await client.query(
        'UPDATE payouts SET stripe_transfer_id = $1, status = $2 WHERE id = $3',
        [transfer.id, 'processing', payout.id]
      );

      // Mark associated payments as paid out
      await this.markPaymentsAsPaidOut(sellerId, amountCents, client);

      await client.query('COMMIT');

      return {
        ...payout,
        stripeTransferId: transfer.id,
        estimatedArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Mark payments as paid out
   */
  private async markPaymentsAsPaidOut(sellerId: string, amountCents: number, client: any): Promise<void> {
    // FIFO - mark oldest unpayout payments first
    const query = `
      UPDATE payments 
      SET payout_status = 'paid_out', payout_date = NOW()
      WHERE id IN (
        SELECT id FROM payments 
        WHERE seller_id = $1 
        AND status = 'succeeded' 
        AND payout_status = 'pending'
        AND completed_at <= NOW() - INTERVAL '7 days'
        ORDER BY completed_at ASC
        LIMIT (
          SELECT COUNT(*) FROM (
            SELECT id FROM payments 
            WHERE seller_id = $1 
            AND status = 'succeeded' 
            AND payout_status = 'pending'
            AND completed_at <= NOW() - INTERVAL '7 days'
            ORDER BY completed_at ASC
          ) p
          WHERE (SELECT COALESCE(SUM(seller_amount_cents), 0) FROM payments p2 WHERE p2.id <= p.id) <= $2
        )
      )
    `;

    await client.query(query, [sellerId, amountCents]);
  }

  /**
   * Get payout history for seller
   */
  async getPayoutHistory(sellerId: string, limit = 20, offset = 0): Promise<any[]> {
    const query = `
      SELECT 
        p.*,
        ba.account_holder_name,
        ba.bank_name,
        ba.account_number,
        ba.account_type
      FROM payouts p
      JOIN bank_accounts ba ON p.bank_account_id = ba.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [sellerId, limit, offset]);
    return result.rows;
  }

  /**
   * Process payout batch (for automated payouts)
   */
  async processPayoutBatch(): Promise<PayoutBatch> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create batch record
      const batchQuery = `
        INSERT INTO payout_batches (total_amount_cents, total_fees_cents, payout_count, status)
        VALUES (0, 0, 0, 'processing')
        RETURNING *
      `;

      const batchResult = await client.query(batchQuery);
      const batch = batchResult.rows[0];

      // Get all sellers with available balance > $10
      const sellersQuery = `
        SELECT 
          p.seller_id,
          COALESCE(SUM(CASE WHEN p.status = 'succeeded' AND p.completed_at <= NOW() - INTERVAL '7 days' 
                       AND NOT EXISTS (SELECT 1 FROM payouts WHERE payment_id = p.id) 
                       THEN p.seller_amount_cents ELSE 0 END), 0) as available_balance,
          MIN(ba.id) as bank_account_id
        FROM payments p
        JOIN bank_accounts ba ON p.seller_id = ba.user_id
        WHERE p.status = 'succeeded'
        AND p.completed_at <= NOW() - INTERVAL '7 days'
        AND NOT EXISTS (SELECT 1 FROM payouts WHERE payment_id = p.id)
        AND ba.status = 'verified'
        GROUP BY p.seller_id
        HAVING COALESCE(SUM(CASE WHEN p.status = 'succeeded' AND p.completed_at <= NOW() - INTERVAL '7 days' 
                             AND NOT EXISTS (SELECT 1 FROM payouts WHERE payment_id = p.id) 
                             THEN p.seller_amount_cents ELSE 0 END), 0) >= 1000
      `;

      const sellersResult = await client.query(sellersQuery);
      const sellers = sellersResult.rows;

      let totalAmount = 0;
      let totalFees = 0;
      let payoutCount = 0;

      // Process each seller payout
      for (const seller of sellers) {
        try {
          const feeCents = Math.max(seller.available_balance * 0.01, 100);
          const netAmountCents = seller.available_balance - feeCents;

          // Create payout record
          await client.query(`
            INSERT INTO payouts (
              seller_id, bank_account_id, amount_cents, fee_cents, net_amount_cents,
              status, currency, payout_batch_id
            ) VALUES ($1, $2, $3, $4, $5, 'pending', 'usd', $6)
          `, [
            seller.seller_id,
            seller.bank_account_id,
            seller.available_balance,
            feeCents,
            netAmountCents,
            batch.id,
          ]);

          totalAmount += seller.available_balance;
          totalFees += feeCents;
          payoutCount++;

        } catch (error) {
          console.error(`Failed to create payout for seller ${seller.seller_id}:`, error);
        }
      }

      // Update batch totals
      await client.query(`
        UPDATE payout_batches 
        SET total_amount_cents = $1, total_fees_cents = $2, payout_count = $3, status = 'completed'
        WHERE id = $4
      `, [totalAmount, totalFees, payoutCount, batch.id]);

      await client.query('COMMIT');

      return {
        ...batch,
        totalAmountCents: totalAmount,
        totalFeesCents: totalFees,
        payoutCount,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle Stripe transfer webhook
   */
  async handleTransferWebhook(transfer: Stripe.Transfer): Promise<void> {
    const payoutId = transfer.metadata?.payout_id;

    if (!payoutId) {
      return;
    }

    const status = transfer.status === 'paid' ? 'completed' : 'failed';
    const errorMessage = transfer.failure_message;

    const query = `
      UPDATE payouts 
      SET status = $1, completed_at = NOW(), error_message = $2
      WHERE stripe_transfer_id = $3
    `;

    await this.pool.query(query, [status, errorMessage, transfer.id]);

    // Send email notification
    if (status === 'completed') {
      // Send success email
    } else {
      // Send failure email
    }
  }

  /**
   * Get seller payout summary
   */
  async getPayoutSummary(sellerId: string): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_payouts,
        COALESCE(SUM(amount_cents), 0) as total_amount,
        COALESCE(SUM(fee_cents), 0) as total_fees,
        COALESCE(SUM(net_amount_cents), 0) as total_net,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount_cents ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'processing' THEN amount_cents ELSE 0 END), 0) as processing_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount_cents ELSE 0 END), 0) as completed_amount,
        MAX(created_at) as last_payout_date
      FROM payouts 
      WHERE seller_id = $1
    `;

    const result = await this.pool.query(query, [sellerId]);
    return result.rows[0];
  }
}
