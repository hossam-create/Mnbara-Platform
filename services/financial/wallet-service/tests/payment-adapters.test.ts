
import { StripeAdapter } from '../src/adapters/stripe.adapter';
import { PaymobAdapter } from '../src/adapters/paymob.adapter';
import * as crypto from 'crypto';

describe('Payment Gateway Security Hotfix', () => {
  const TEST_STRIPE_SECRET = 'whsec_test_secret_123';
  const TEST_PAYMOB_HMAC_SECRET = 'TEST_HMAC_SECRET_ABC';

  // Instantiate adapters with test keys (not 'mock' to avoid constructor error)
  const stripeAdapter = new StripeAdapter('sk_test_123', TEST_STRIPE_SECRET);
  const paymobAdapter = new PaymobAdapter('pk_test_123', 'ints_123', TEST_PAYMOB_HMAC_SECRET);

  describe('StripeAdapter Webhook Verification', () => {
    it('should REJECT missing signature header', async () => {
      await expect(stripeAdapter.verifyWebhook({
        headers: {},
        body: {},
        rawBody: Buffer.from('{}')
      })).rejects.toThrow('Missing Stripe-Signature header');
    });

    it('should REJECT invalid signature', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const t = Math.floor(Date.now() / 1000);
      const invalidSig = 'invalid_hash';

      await expect(stripeAdapter.verifyWebhook({
        headers: {
          'stripe-signature': `t=${t},v1=${invalidSig}`
        },
        body: JSON.parse(payload),
        rawBody: Buffer.from(payload)
      })).rejects.toThrow('Invalid Webhook Signature');
    });

    it('should REJECT replay attacks (old timestamp)', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const t = Math.floor(Date.now() / 1000) - 600; // 10 mins ago (limit is 5 mins)
      
      const signedPayload = `${t}.${payload}`;
      const sig = crypto.createHmac('sha256', TEST_STRIPE_SECRET).update(signedPayload).digest('hex');

      await expect(stripeAdapter.verifyWebhook({
        headers: {
          'stripe-signature': `t=${t},v1=${sig}`
        },
        body: JSON.parse(payload),
        rawBody: Buffer.from(payload)
      })).rejects.toThrow('Webhook signature timestamp too old');
    });

    it('should ACCEPT valid signature', async () => {
      const payloadObj = { 
        type: 'payment_intent.succeeded', 
        data: { object: { id: 'pi_123', amount: 1000, currency: 'usd' } } 
      };
      const payload = JSON.stringify(payloadObj);
      const t = Math.floor(Date.now() / 1000);
      
      const signedPayload = `${t}.${payload}`;
      const sig = crypto.createHmac('sha256', TEST_STRIPE_SECRET).update(signedPayload).digest('hex');

      const result = await stripeAdapter.verifyWebhook({
        headers: {
          'stripe-signature': `t=${t},v1=${sig}`
        },
        body: payloadObj,
        rawBody: Buffer.from(payload)
      });

      expect(result.verified).toBe(true);
      expect(result.gatewayReferenceId).toBe('pi_123');
      expect(result.eventType).toBe('PAYMENT_SUCCESS');
    });
  });

  describe('PaymobAdapter Webhook Verification', () => {
    // Paymob keys for HMAC: amount_cents, created_at, currency, error_occured, has_parent_transaction, id, integration_id, is_3d_secure, is_auth, is_capture, is_refunded, is_standalone_payment, is_voided, order, owner, pending, source_data.pan, source_data.sub_type, source_data.type, success
    // Note: order is special (order.id)
    
    it('should REJECT missing HMAC', async () => {
      await expect(paymobAdapter.verifyWebhook({
        headers: {},
        body: {},
        rawBody: Buffer.from('{}')
      })).rejects.toThrow('Missing Paymob HMAC');
    });

    it('should REJECT invalid HMAC', async () => {
      await expect(paymobAdapter.verifyWebhook({
        headers: { 'hmac': 'invalid' },
        body: { obj: { id: 123 } },
        rawBody: Buffer.from('{}')
      })).rejects.toThrow('Invalid Webhook Signature');
    });

    it('should ACCEPT valid HMAC (Transaction Processed)', async () => {
      const transaction = {
        amount_cents: 1000,
        created_at: '2023-01-01',
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: 123456,
        integration_id: 999,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: false,
        is_voided: false,
        order: { id: 8888 }, // Expects ID extraction
        owner: 777,
        pending: false,
        source_data: { pan: '1234', sub_type: 'Visa', type: 'card' },
        success: true
      };

      // Construct HMAC string in specific order
      // We manually construct it here to match the Adapter's expectation logic
      // amount_cents... success
      // Note: Booleans become "true"/"false" if code does that. 
      // Checking adapter code: if (val === true) val = 'true';
      // So in test we must match what adapter expects.
      
      const concatenated = 
        '1000' + // amount_cents
        '2023-01-01' + // created_at
        'EGP' + // currency
        'false' + // error_occured
        'false' + // has_parent_transaction
        '123456' + // id
        '999' + // integration_id
        'true' + // is_3d_secure
        'false' + // is_auth
        'false' + // is_capture
        'false' + // is_refunded
        'false' + // is_standalone_payment
        'false' + // is_voided
        '8888' + // order (id)
        '777' + // owner
        'false' + // pending
        '1234' + // source_data.pan
        'Visa' + // sub_type
        'card' + // type
        'true'; // success

      const hmac = crypto.createHmac('sha512', TEST_PAYMOB_HMAC_SECRET).update(concatenated).digest('hex');

      const result = await paymobAdapter.verifyWebhook({
        headers: { 'hmac': hmac },
        body: { obj: transaction }, 
        rawBody: Buffer.from('')
      });

      expect(result.verified).toBe(true);
      expect(result.gatewayReferenceId).toBe('8888');
      expect(result.eventType).toBe('PAYMENT_SUCCESS');
      expect(result.amount).toBe(1000n);
    });
  });
});
