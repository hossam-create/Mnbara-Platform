import { Pool } from 'pg';
import Stripe from 'stripe';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  interval: 'month' | 'year';
  features: string[];
  isActive: boolean;
}

export interface UserSubscription {
  userId: string;
  planId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string;
}

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  stripePaymentMethodId: string;
}

export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: Date;
}

export class AdvancedPaymentService {
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

  // ==================== SUBSCRIPTIONS ====================

  /**
   * Create subscription plan
   */
  async createSubscriptionPlan(plan: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> {
    // Create Stripe product
    const product = await this.stripe.products.create({
      name: plan.name,
      description: plan.description,
      type: 'service',
    });

    // Create Stripe price
    const price = await this.stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceCents,
      currency: 'usd',
      recurring: {
        interval: plan.interval,
      },
    });

    // Save plan to database
    const query = `
      INSERT INTO subscription_plans (
        name, description, price_cents, interval, features, is_active,
        stripe_product_id, stripe_price_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      plan.name,
      plan.description,
      plan.priceCents,
      plan.interval,
      JSON.stringify(plan.features),
      plan.isActive,
      product.id,
      price.id,
    ]);

    return result.rows[0];
  }

  /**
   * Subscribe user to plan
   */
  async subscribeUser(userId: string, planId: string, paymentMethodId: string): Promise<UserSubscription> {
    // Get plan details
    const planQuery = `
      SELECT * FROM subscription_plans WHERE id = $1 AND is_active = true
    `;
    const planResult = await this.pool.query(planQuery, [planId]);
    const plan = planResult.rows[0];

    if (!plan) {
      throw new Error('Plan not found or inactive');
    }

    // Get or create Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    // Attach payment method to customer
    await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    // Set as default payment method
    await this.stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripe_price_id }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    // Save subscription to database
    const query = `
      INSERT INTO user_subscriptions (
        user_id, plan_id, status, current_period_start, current_period_end,
        stripe_subscription_id, stripe_customer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      userId,
      planId,
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.id,
      customerId,
    ]);

    return result.rows[0];
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, subscriptionId: string, immediate = false): Promise<any> {
    // Get subscription
    const query = `
      SELECT * FROM user_subscriptions 
      WHERE user_id = $1 AND stripe_subscription_id = $2 AND status = 'active'
    `;
    const result = await this.pool.query(query, [userId, subscriptionId]);
    const subscription = result.rows[0];

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel in Stripe
    const canceledSubscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: !immediate,
      ...(immediate && { cancellation_details: { comment: 'User requested immediate cancellation' } }),
    });

    // Update database
    const newStatus = immediate ? 'canceled' : 'canceled_at_period_end';
    await this.pool.query(`
      UPDATE user_subscriptions 
      SET status = $1, canceled_at = NOW() 
      WHERE id = $2
    `, [newStatus, subscription.id]);

    return {
      subscription: canceledSubscription,
      effectiveDate: immediate ? new Date() : new Date(canceledSubscription.cancel_at * 1000),
    };
  }

  // ==================== SAVED PAYMENT METHODS ====================

  /**
   * Save payment method
   */
  async savePaymentMethod(userId: string, paymentMethodId: string, isDefault = false): Promise<SavedPaymentMethod> {
    // Get Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    // Retrieve payment method from Stripe
    const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

    // Attach to customer if not already attached
    if (!paymentMethod.customer) {
      await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    }

    // Set as default if requested
    if (isDefault) {
      await this.stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      // Update other methods to not be default
      await this.pool.query(`
        UPDATE saved_payment_methods SET is_default = false WHERE user_id = $1
      `, [userId]);
    }

    // Save to database
    const query = `
      INSERT INTO saved_payment_methods (
        user_id, type, last4, brand, expiry_month, expiry_year, is_default,
        stripe_payment_method_id, stripe_customer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (stripe_payment_method_id) 
      DO UPDATE SET 
        is_default = EXCLUDED.is_default,
        updated_at = NOW()
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      userId,
      paymentMethod.type,
      paymentMethod.card?.last4 || paymentMethod.us_bank_account?.last4,
      paymentMethod.card?.brand,
      paymentMethod.card?.exp_month,
      paymentMethod.card?.exp_year,
      isDefault,
      paymentMethodId,
      customerId,
    ]);

    return result.rows[0];
  }

  /**
   * Get user's saved payment methods
   */
  async getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
    const query = `
      SELECT * FROM saved_payment_methods 
      WHERE user_id = $1 
      ORDER BY is_default DESC, created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    // Get payment method
    const query = `
      SELECT * FROM saved_payment_methods 
      WHERE user_id = $1 AND stripe_payment_method_id = $2
    `;
    const result = await this.pool.query(query, [userId, paymentMethodId]);
    const paymentMethod = result.rows[0];

    if (!paymentMethod) {
      throw new Error('Payment method not found');
    }

    // Detach from Stripe
    await this.stripe.paymentMethods.detach(paymentMethodId);

    // Delete from database
    await this.pool.query(`
      DELETE FROM saved_payment_methods WHERE id = $1
    `, [paymentMethod.id]);
  }

  // ==================== MULTI-CURRENCY ====================

  /**
   * Convert currency
   */
  async convertCurrency(amountCents: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amountCents;
    }

    // Get exchange rate
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    
    return Math.round(amountCents * rate);
  }

  /**
   * Get exchange rate
   */
  private async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // Check cache first
    const cacheQuery = `
      SELECT rate FROM currency_rates 
      WHERE from_currency = $1 AND to_currency = $2 
      AND timestamp > NOW() - INTERVAL '1 hour'
    `;
    const cacheResult = await this.pool.query(cacheQuery, [fromCurrency, toCurrency]);

    if (cacheResult.rows[0]) {
      return cacheResult.rows[0].rate;
    }

    // Fetch from external API (e.g., exchangerate-api.com)
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const data = await response.json();
    const rate = data.rates[toCurrency];

    if (!rate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    // Cache the rate
    await this.pool.query(`
      INSERT INTO currency_rates (from_currency, to_currency, rate, timestamp)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (from_currency, to_currency) 
      DO UPDATE SET rate = EXCLUDED.rate, timestamp = NOW()
    `, [fromCurrency, toCurrency, rate]);

    return rate;
  }

  /**
   * Process payment in different currency
   */
  async processMultiCurrencyPayment(paymentData: {
    listingId: string;
    buyerId: string;
    currency: string;
    paymentMethodId: string;
  }): Promise<any> {
    // Get listing price in USD
    const listingQuery = `
      SELECT price_cents FROM listings WHERE id = $1
    `;
    const listingResult = await this.pool.query(listingQuery, [paymentData.listingId]);
    const listing = listingResult.rows[0];

    // Convert to requested currency
    const convertedAmount = await this.convertCurrency(
      listing.price_cents,
      'USD',
      paymentData.currency
    );

    // Create payment intent with converted currency
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: convertedAmount,
      currency: paymentData.currency.toLowerCase(),
      payment_method: paymentData.paymentMethodId,
      confirm: true,
      customer: await this.getOrCreateStripeCustomer(paymentData.buyerId),
      metadata: {
        listingId: paymentData.listingId,
        original_amount_usd: listing.price_cents.toString(),
        converted_amount: convertedAmount.toString(),
        currency: paymentData.currency,
      },
    });

    return paymentIntent;
  }

  // ==================== INSTALLMENTS ====================

  /**
   * Create installment plan
   */
  async createInstallmentPlan(
    userId: string,
    amountCents: number,
    installmentCount: number,
    paymentMethodId: string
  ): Promise<any> {
    const installmentAmount = Math.ceil(amountCents / installmentCount);
    const totalInstallmentAmount = installmentAmount * installmentCount;

    // Create Stripe subscription for installments
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price_data: {
          currency: 'usd',
          unit_amount: installmentAmount,
          product: 'prod_installment_plan',
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
        },
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      payment_method: paymentMethodId,
      metadata: {
        type: 'installment_plan',
        total_amount: totalInstallmentAmount.toString(),
        installment_count: installmentCount.toString(),
      },
    });

    // Save installment plan
    const query = `
      INSERT INTO installment_plans (
        user_id, total_amount_cents, installment_amount_cents, installment_count,
        status, stripe_subscription_id, created_at
      ) VALUES ($1, $2, $3, $4, 'active', $5, NOW())
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      userId,
      totalInstallmentAmount,
      installmentAmount,
      installmentCount,
      subscription.id,
    ]);

    return {
      plan: result.rows[0],
      subscription,
      nextPaymentDate: new Date(subscription.current_period_end * 1000),
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get or create Stripe customer
   */
  private async getOrCreateStripeCustomer(userId: string): Promise<string> {
    // Check if customer exists
    const customerQuery = `
      SELECT stripe_customer_id FROM user_stripe_customers WHERE user_id = $1
    `;
    const customerResult = await this.pool.query(customerQuery, [userId]);

    if (customerResult.rows[0]) {
      return customerResult.rows[0].stripe_customer_id;
    }

    // Get user details
    const userQuery = `
      SELECT email, full_name FROM users WHERE id = $1
    `;
    const userResult = await this.pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    // Create Stripe customer
    const customer = await this.stripe.customers.create({
      email: user.email,
      name: user.full_name,
      metadata: { user_id: userId },
    });

    // Save customer reference
    await this.pool.query(`
      INSERT INTO user_stripe_customers (user_id, stripe_customer_id)
      VALUES ($1, $2)
    `, [userId, customer.id]);

    return customer.id;
  }

  /**
   * Handle subscription webhook
   */
  async handleSubscriptionWebhook(subscription: Stripe.Subscription): Promise<void> {
    const query = `
      UPDATE user_subscriptions 
      SET status = $1, current_period_start = $2, current_period_end = $3
      WHERE stripe_subscription_id = $4
    `;

    await this.pool.query(query, [
      subscription.status,
      new Date(subscription.current_period_start * 1000),
      new Date(subscription.current_period_end * 1000),
      subscription.id,
    ]);

    // Send notifications based on status changes
    if (subscription.status === 'past_due') {
      // Send payment reminder
    } else if (subscription.status === 'canceled') {
      // Send cancellation confirmation
    }
  }

  /**
   * Get user's subscription status
   */
  async getUserSubscription(userId: string): Promise<UserSubscription | null> {
    const query = `
      SELECT us.*, sp.name as plan_name, sp.features
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(startDate: Date, endDate: Date): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount_cents) as total_volume,
        AVG(amount_cents) as avg_transaction_value,
        COUNT(DISTINCT buyer_id) as unique_buyers,
        COUNT(DISTINCT seller_id) as unique_sellers,
        SUM(marketplace_fee_cents) as total_fees,
        currency,
        DATE_TRUNC('day', created_at) as date
      FROM payments 
      WHERE status = 'succeeded' 
      AND created_at BETWEEN $1 AND $2
      GROUP BY currency, DATE_TRUNC('day', created_at)
      ORDER BY date DESC
    `;

    const result = await this.pool.query(query, [startDate, endDate]);
    return result.rows;
  }
}
