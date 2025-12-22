/**
 * PSP adapter simulates a PSP-managed custody integration. Mnbarh never stores money.
 * The PSP exposes intents, release, and refund endpoints; we simply forward requests.
 */

export type PaymentMethod =
  | 'card_visa'
  | 'card_mastercard'
  | 'wallet_vodafone_cash'
  | 'wallet_orange'
  | 'wallet_etisalat'
  | 'instant_bank_transfer'
  | 'fawry';

export type PSPIntentStatus =
  | 'requires_payment_method'
  | 'pending_capture'
  | 'funds_secured'
  | 'released'
  | 'refunded';

export type PSPIntent = {
  id: string;
  status: PSPIntentStatus;
  client_secret: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
};

export type CreateIntentParams = {
  amount: number;
  currency: 'EGP';
  orderId: string;
  customerId: string;
  paymentMethod: PaymentMethod;
};

class PSPAdapter {
  async createIntent(params: CreateIntentParams): Promise<PSPIntent> {
    // In production this would call the PSP REST API. Here we simulate a response.
    return {
      id: `pi_${Date.now()}`,
      status: 'pending_capture',
      client_secret: `secret_${Math.random().toString(16).slice(2)}`,
      amount: params.amount,
      currency: params.currency,
      metadata: {
        orderId: params.orderId,
        customerId: params.customerId,
        paymentMethod: params.paymentMethod,
      },
    };
  }

  async releaseFunds(intentId: string, actor: string) {
    return {
      intentId,
      status: 'released' as PSPIntentStatus,
      releasedBy: actor,
      releasedAt: new Date().toISOString(),
    };
  }

  async refund(intentId: string, reason: string) {
    return {
      intentId,
      status: 'refunded' as PSPIntentStatus,
      refundedAt: new Date().toISOString(),
      reason,
    };
  }

  async handleWebhookEvent(event: { type: string; data: unknown }) {
    // Normally signature verification would occur here.
    return { acknowledged: true, event };
  }
}

export const pspAdapter = new PSPAdapter();
