import { pspAdapter, type PaymentMethod } from './psp.adapter';

export type CreatePaymentIntentInput = {
  orderId: string;
  customerId: string;
  amount: number;
  currency?: 'EGP';
  paymentMethod: PaymentMethod;
};

export async function createPaymentIntent(input: CreatePaymentIntentInput) {
  return pspAdapter.createIntent({
    amount: input.amount,
    currency: input.currency ?? 'EGP',
    orderId: input.orderId,
    customerId: input.customerId,
    paymentMethod: input.paymentMethod,
  });
}

export async function releasePayment(intentId: string, actor: string) {
  return pspAdapter.releaseFunds(intentId, actor);
}

export async function refundPayment(intentId: string, reason: string) {
  return pspAdapter.refund(intentId, reason);
}

export async function acknowledgeWebhook(event: { type: string; data: unknown }) {
  return pspAdapter.handleWebhookEvent(event);
}
