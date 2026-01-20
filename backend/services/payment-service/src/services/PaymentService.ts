import { Pool } from 'pg';

export interface PaymentRecord {
  stripePaymentIntentId: string;
  orderId?: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  amountCents: number;
  marketplaceFeeCents: number;
  sellerAmountCents: number;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  currency: string;
  stripeFeeCents?: number;
  netAmountCents?: number;
  errorMessage?: string;
}

export interface OrderRecord {
  paymentIntentId: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  quantity: number;
  unitPriceCents: number;
  totalAmountCents: number;
  shippingAddress: any;
}

export interface TransactionRecord {
  paymentIntentId: string;
  itemTotal: number;
  marketplaceFee: number;
  buyerId: string;
  sellerId: string;
}

export class PaymentService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Get listing details
   */
  async getListing(listingId: string) {
    const query = `
      SELECT id, title, price_cents, seller_id, status 
      FROM listings 
      WHERE id = $1
    `;
    
    const result = await this.pool.query(query, [listingId]);
    return result.rows[0] || null;
  }

  /**
   * Create payment record
   */
  async createPaymentRecord(payment: PaymentRecord) {
    const query = `
      INSERT INTO payments (
        stripe_payment_intent_id,
        buyer_id,
        seller_id,
        listing_id,
        amount_cents,
        marketplace_fee_cents,
        seller_amount_cents,
        status,
        currency
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;
    
    const values = [
      payment.stripePaymentIntentId,
      payment.buyerId,
      payment.sellerId,
      payment.listingId,
      payment.amountCents,
      payment.marketplaceFeeCents,
      payment.sellerAmountCents,
      payment.status,
      payment.currency
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Create order record
   */
  async createOrder(order: OrderRecord) {
    const query = `
      INSERT INTO orders (
        payment_id,
        buyer_id,
        seller_id,
        listing_id,
        quantity,
        unit_price_cents,
        total_amount_cents,
        shipping_address,
        status
      ) VALUES (
        (SELECT id FROM payments WHERE stripe_payment_intent_id = $1),
        $2, $3, $4, $5, $6, $7, $8, 'paid'
      )
      RETURNING id
    `;
    
    const values = [
      order.paymentIntentId,
      order.buyerId,
      order.sellerId,
      order.listingId,
      order.quantity,
      order.unitPriceCents,
      order.totalAmountCents,
      JSON.stringify(order.shippingAddress)
    ];
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    paymentIntentId: string, 
    status: string, 
    updates: Partial<PaymentRecord> = {}
  ) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Add status
    fields.push(`status = $${paramIndex++}`);
    values.push(status);

    // Add optional fields
    if (updates.orderId) {
      fields.push(`order_id = $${paramIndex++}`);
      values.push(updates.orderId);
    }

    if (updates.stripeFeeCents !== undefined) {
      fields.push(`stripe_fee_cents = $${paramIndex++}`);
      values.push(updates.stripeFeeCents);
    }

    if (updates.netAmountCents !== undefined) {
      fields.push(`net_amount_cents = $${paramIndex++}`);
      values.push(updates.netAmountCents);
    }

    if (updates.errorMessage) {
      fields.push(`error_message = $${paramIndex++}`);
      values.push(updates.errorMessage);
    }

    if (updates.completedAt) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(updates.completedAt);
    }

    // Add updated_at
    fields.push(`updated_at = NOW()`);

    // Add payment intent ID
    values.push(paymentIntentId);

    const query = `
      UPDATE payments 
      SET ${fields.join(', ')}
      WHERE stripe_payment_intent_id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get payment by intent ID
   */
  async getPaymentByIntentId(paymentIntentId: string) {
    const query = `
      SELECT * FROM payments 
      WHERE stripe_payment_intent_id = $1
    `;
    
    const result = await this.pool.query(query, [paymentIntentId]);
    return result.rows[0] || null;
  }

  /**
   * Create transaction records
   */
  async createTransactions(transaction: TransactionRecord) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create sale transaction (buyer to seller)
      const saleQuery = `
        INSERT INTO transactions (
          payment_id,
          type,
          amount_cents,
          currency,
          from_user_id,
          to_user_id,
          status
        ) VALUES (
          (SELECT id FROM payments WHERE stripe_payment_intent_id = $1),
          'sale',
          $2,
          'USD',
          $3,
          $4,
          'completed'
        )
        RETURNING id
      `;

      await client.query(saleQuery, [
        transaction.paymentIntentId,
        transaction.itemTotal,
        transaction.buyerId,
        transaction.sellerId
      ]);

      // Create marketplace fee transaction (seller to platform)
      const feeQuery = `
        INSERT INTO transactions (
          payment_id,
          type,
          amount_cents,
          currency,
          from_user_id,
          to_user_id,
          status
        ) VALUES (
          (SELECT id FROM payments WHERE stripe_payment_intent_id = $1),
          'marketplace_fee',
          $2,
          'USD',
          $3,
          NULL,
          'completed'
        )
        RETURNING id
      `;

      await client.query(feeQuery, [
        transaction.paymentIntentId,
        transaction.marketplaceFee,
        transaction.sellerId
      ]);

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get payment history for user
   */
  async getPaymentHistory(userId: string, role: 'buyer' | 'seller') {
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
    
    const query = `
      SELECT 
        p.*,
        l.title as listing_title,
        l.images,
        o.quantity,
        o.status as order_status,
        o.created_at as order_created_at
      FROM payments p
      JOIN listings l ON p.listing_id = l.id
      LEFT JOIN orders o ON p.order_id = o.id
      WHERE p.${column} = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats(userId: string, role: 'buyer' | 'seller') {
    const column = role === 'buyer' ? 'buyer_id' : 'seller_id';
    
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN status = 'succeeded' THEN amount_cents ELSE 0 END) as total_amount,
        SUM(CASE WHEN status = 'succeeded' THEN marketplace_fee_cents ELSE 0 END) as total_fees,
        AVG(CASE WHEN status = 'succeeded' THEN amount_cents ELSE NULL END) as avg_amount
      FROM payments 
      WHERE ${column} = $1
    `;
    
    const result = await this.pool.query(query, [userId]);
    return result.rows[0];
  }
}
