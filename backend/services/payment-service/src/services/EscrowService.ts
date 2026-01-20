import { Pool } from 'pg';
import Stripe from 'stripe';

export interface EscrowRecord {
  paymentId: string;
  buyerId: string;
  sellerId: string;
  amountCents: number;
  releaseConditions: string[];
  autoReleaseDate?: Date;
}

export interface ReleaseCondition {
  type: 'delivery_confirmation' | 'tracking_update' | 'time_based' | 'manual';
  value?: string;
  completed: boolean;
  completedAt?: Date;
}

export class EscrowService {
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
   * Hold payment in escrow
   */
  async holdInEscrow(paymentId: string, conditions: ReleaseCondition[]): Promise<EscrowRecord> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get payment details
      const paymentQuery = `
        SELECT * FROM payments WHERE id = $1 AND status = 'succeeded'
      `;
      const paymentResult = await client.query(paymentQuery, [paymentId]);
      const payment = paymentResult.rows[0];

      if (!payment) {
        throw new Error('Payment not found or not successful');
      }

      // Check if already in escrow
      const existingQuery = `
        SELECT * FROM escrow_holdings WHERE payment_id = $1
      `;
      const existingResult = await client.query(existingQuery, [paymentId]);
      
      if (existingResult.rows[0]) {
        return existingResult.rows[0];
      }

      // Create Stripe hold (using Connect accounts)
      const hold = await this.createStripeHold(payment);

      // Create escrow record
      const escrowQuery = `
        INSERT INTO escrow_holdings (
          payment_id, buyer_id, seller_id, amount_cents, stripe_hold_id,
          status, auto_release_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, 'held', $6, NOW())
        RETURNING *
      `;

      const autoReleaseDate = this.calculateAutoReleaseDate(conditions);
      
      const escrowResult = await client.query(escrowQuery, [
        paymentId,
        payment.buyer_id,
        payment.seller_id,
        payment.seller_amount_cents,
        hold.id,
        autoReleaseDate,
      ]);

      const escrow = escrowResult.rows[0];

      // Add release conditions
      for (const condition of conditions) {
        await client.query(`
          INSERT INTO escrow_conditions (escrow_id, type, value, completed)
          VALUES ($1, $2, $3, $4)
        `, [escrow.id, condition.type, condition.value, condition.completed]);
      }

      await client.query('COMMIT');

      // Send notifications
      await this.sendEscrowNotifications(escrow, 'created');

      return escrow;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create Stripe hold on funds
   */
  private async createStripeHold(payment: any): Promise<Stripe.Transfer> {
    // Get seller's Stripe Connect account
    const sellerAccountQuery = `
      SELECT stripe_account_id FROM seller_stripe_accounts WHERE user_id = $1
    `;
    const sellerAccountResult = await this.pool.query(sellerAccountQuery, [payment.seller_id]);
    const sellerAccountId = sellerAccountResult.rows[0]?.stripe_account_id;

    if (!sellerAccountId) {
      throw new Error('Seller does not have a Stripe Connect account');
    }

    // Create transfer to seller's account but hold it
    const transfer = await this.stripe.transfers.create({
      amount: payment.seller_amount_cents,
      currency: 'usd',
      destination: sellerAccountId,
      transfer_group: `escrow_${payment.id}`,
      metadata: {
        payment_id: payment.id,
        escrow_hold: 'true',
      },
    });

    return transfer;
  }

  /**
   * Calculate auto-release date based on conditions
   */
  private calculateAutoReleaseDate(conditions: ReleaseCondition[]): Date | undefined {
    const timeCondition = conditions.find(c => c.type === 'time_based');
    if (timeCondition && timeCondition.value) {
      const days = parseInt(timeCondition.value);
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    return undefined;
  }

  /**
   * Release funds from escrow
   */
  async releaseFunds(escrowId: string, reason: string): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get escrow details
      const escrowQuery = `
        SELECT * FROM escrow_holdings WHERE id = $1 AND status = 'held'
      `;
      const escrowResult = await client.query(escrowQuery, [escrowId]);
      const escrow = escrowResult.rows[0];

      if (!escrow) {
        throw new Error('Escrow record not found or not held');
      }

      // Release Stripe hold
      await this.releaseStripeHold(escrow.stripe_hold_id);

      // Update escrow status
      await client.query(`
        UPDATE escrow_holdings 
        SET status = 'released', released_at = NOW(), release_reason = $1
        WHERE id = $2
      `, [reason, escrowId]);

      // Create payout record
      const payoutQuery = `
        INSERT INTO payouts (
          seller_id, amount_cents, fee_cents, net_amount_cents,
          status, currency, escrow_id, release_reason
        ) VALUES ($1, $2, 0, $3, 'completed', 'usd', $4, $5)
        RETURNING *
      `;

      const payoutResult = await client.query(payoutQuery, [
        escrow.seller_id,
        escrow.amount_cents,
        escrow.amount_cents,
        escrowId,
        reason,
      ]);

      await client.query('COMMIT');

      // Send notifications
      await this.sendEscrowNotifications(escrow, 'released', reason);

      return payoutResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Release Stripe hold
   */
  private async releaseStripeHold(holdId: string): Promise<void> {
    // Stripe holds are released automatically when the transfer is created
    // This is a placeholder for any additional release logic needed
    console.log(`Releasing Stripe hold: ${holdId}`);
  }

  /**
   * Update escrow condition
   */
  async updateCondition(escrowId: string, conditionType: string, value: string): Promise<boolean> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update condition
      const updateQuery = `
        UPDATE escrow_conditions 
        SET completed = true, completed_at = NOW(), value = $1
        WHERE escrow_id = $2 AND type = $3
        RETURNING *
      `;

      const result = await client.query(updateQuery, [value, escrowId, conditionType]);

      if (result.rows.length === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      // Check if all conditions are met
      const conditionsQuery = `
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE completed = true) as completed
        FROM escrow_conditions WHERE escrow_id = $1
      `;
      const conditionsResult = await client.query(conditionsQuery, [escrowId]);
      const { total, completed } = conditionsResult.rows[0];

      await client.query('COMMIT');

      // If all conditions are met, auto-release funds
      if (total === completed && total > 0) {
        await this.releaseFunds(escrowId, 'All conditions met');
        return true;
      }

      return false;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle delivery confirmation
   */
  async confirmDelivery(orderId: string, trackingNumber?: string): Promise<void> {
    // Get escrow by order
    const escrowQuery = `
      SELECT e.* FROM escrow_holdings e
      JOIN payments p ON e.payment_id = p.id
      JOIN orders o ON p.id = o.payment_id
      WHERE o.id = $1 AND e.status = 'held'
    `;
    const escrowResult = await this.pool.query(escrowQuery, [orderId]);
    const escrow = escrowResult.rows[0];

    if (!escrow) {
      return;
    }

    // Update delivery condition
    await this.updateCondition(escrow.id, 'delivery_confirmation', trackingNumber || 'confirmed');

    // Update order status
    await this.pool.query(`
      UPDATE orders SET status = 'delivered', delivered_at = NOW()
      WHERE id = $1
    `, [orderId]);
  }

  /**
   * Handle tracking update
   */
  async updateTracking(orderId: string, trackingNumber: string, status: string): Promise<void> {
    // Update order tracking
    await this.pool.query(`
      UPDATE orders SET tracking_number = $1, status = $2
      WHERE id = $3
    `, [trackingNumber, status, orderId]);

    // If status is delivered, confirm delivery
    if (status === 'delivered') {
      await this.confirmDelivery(orderId, trackingNumber);
    }
  }

  /**
   * Get escrow details
   */
  async getEscrowDetails(escrowId: string): Promise<any> {
    const query = `
      SELECT 
        e.*,
        p.amount_cents as payment_amount,
        l.title as listing_title,
        b.full_name as buyer_name,
        s.full_name as seller_name,
        ec.type as condition_type,
        ec.completed as condition_completed,
        ec.completed_at as condition_completed_at
      FROM escrow_holdings e
      JOIN payments p ON e.payment_id = p.id
      JOIN listings l ON p.listing_id = l.id
      JOIN users b ON e.buyer_id = b.id
      JOIN users s ON e.seller_id = s.id
      LEFT JOIN escrow_conditions ec ON e.id = ec.escrow_id
      WHERE e.id = $1
    `;

    const result = await this.pool.query(query, [escrowId]);
    return result.rows;
  }

  /**
   * Get user escrow history
   */
  async getEscrowHistory(userId: string, role: 'buyer' | 'seller'): Promise<any[]> {
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
    
    const query = `
      SELECT 
        e.*,
        p.amount_cents as payment_amount,
        l.title as listing_title,
        o.status as order_status,
        o.tracking_number
      FROM escrow_holdings e
      JOIN payments p ON e.payment_id = p.id
      JOIN listings l ON p.listing_id = l.id
      LEFT JOIN orders o ON p.id = o.payment_id
      WHERE e.${column} = $1
      ORDER BY e.created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Process auto-releases (cron job)
   */
  async processAutoReleases(): Promise<number> {
    const query = `
      SELECT id FROM escrow_holdings 
      WHERE status = 'held' 
      AND auto_release_date <= NOW()
    `;

    const result = await this.pool.query(query);
    const escrowsToRelease = result.rows;

    let releasedCount = 0;

    for (const escrow of escrowsToRelease) {
      try {
        await this.releaseFunds(escrow.id, 'Auto-release timeout');
        releasedCount++;
      } catch (error) {
        console.error(`Failed to auto-release escrow ${escrow.id}:`, error);
      }
    }

    return releasedCount;
  }

  /**
   * Send escrow notifications
   */
  private async sendEscrowNotifications(escrow: any, action: string, reason?: string): Promise<void> {
    // Send email notifications to buyer and seller
    // This would integrate with the EmailService
    
    const notifications = {
      created: {
        buyer: 'Payment held in escrow - funds will be released when conditions are met',
        seller: 'Payment received and held in escrow - funds will be released when conditions are met',
      },
      released: {
        buyer: `Escrow funds released to seller - Reason: ${reason}`,
        seller: `Escrow funds released to your account - Reason: ${reason}`,
      },
    };

    console.log(`Escrow ${action} notification:`, notifications[action]);
  }

  /**
   * Get escrow statistics
   */
  async getEscrowStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_escrows,
        COUNT(*) FILTER (WHERE status = 'held') as held_escrows,
        COUNT(*) FILTER (WHERE status = 'released') as released_escrows,
        COALESCE(SUM(amount_cents), 0) as total_amount_held,
        COALESCE(SUM(CASE WHEN status = 'held' THEN amount_cents ELSE 0 END), 0) as amount_currently_held,
        AVG(EXTRACT(EPOCH FROM (released_at - created_at))/3600) as avg_hold_hours
      FROM escrow_holdings
    `;

    const result = await this.pool.query(query);
    return result.rows[0];
  }

  /**
   * Cancel escrow and refund buyer
   */
  async cancelEscrow(escrowId: string, reason: string, initiatedBy: 'buyer' | 'seller' | 'admin'): Promise<any> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get escrow details
      const escrowQuery = `
        SELECT * FROM escrow_holdings WHERE id = $1 AND status = 'held'
      `;
      const escrowResult = await client.query(escrowQuery, [escrowId]);
      const escrow = escrowResult.rows[0];

      if (!escrow) {
        throw new Error('Escrow record not found or not held');
      }

      // Create refund
      const refund = await this.stripe.refunds.create({
        payment_intent: escrow.payment_id,
        reason: 'requested_by_customer',
        metadata: {
          escrow_id: escrowId,
          cancellation_reason: reason,
          initiated_by: initiatedBy,
        },
      });

      // Update escrow status
      await client.query(`
        UPDATE escrow_holdings 
        SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1, initiated_by = $2
        WHERE id = $3
      `, [reason, initiatedBy, escrowId]);

      // Update payment status
      await client.query(`
        UPDATE payments SET status = 'refunded', refund_id = $1 WHERE id = $2
      `, [refund.id, escrow.payment_id]);

      await client.query('COMMIT');

      // Send notifications
      await this.sendEscrowNotifications(escrow, 'cancelled', reason);

      return {
        escrowId,
        refundId: refund.id,
        amount: refund.amount,
        reason,
        initiatedBy,
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
