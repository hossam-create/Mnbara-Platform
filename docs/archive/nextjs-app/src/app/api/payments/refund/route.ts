import { NextRequest, NextResponse } from 'next/server';
import { refundPayment } from '@/services/payments/payment_intent.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intentId, reason } = body ?? {};

    if (!intentId || !reason) {
      return NextResponse.json({ error: 'intentId and reason required.' }, { status: 400 });
    }

    const refund = await refundPayment(intentId, reason);
    return NextResponse.json(refund);
  } catch (error) {
    console.error('[PAYMENT_REFUND_ERROR]', error);
    return NextResponse.json({ error: 'Unable to trigger refund' }, { status: 500 });
  }
}
