import { NextRequest, NextResponse } from 'next/server';
import { handlePaymentWebhook } from '@/services/payments/webhook.controller';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await handlePaymentWebhook(payload);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[PAYMENT_WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
