import { acknowledgeWebhook } from './payment_intent.service';

export async function handlePaymentWebhook(event: { type: string; data: unknown }) {
  if (!event?.type) {
    throw new Error('Invalid webhook payload');
  }

  // Future: persist intent status, notify parties, etc.
  return acknowledgeWebhook(event);
}
