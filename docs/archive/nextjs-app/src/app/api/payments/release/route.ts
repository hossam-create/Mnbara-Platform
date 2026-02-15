import { NextRequest, NextResponse } from 'next/server';
import { releasePayment } from '@/services/payments/payment_intent.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { intentId, actor } = body ?? {};

    if (!intentId || !actor) {
      return NextResponse.json({ error: 'intentId and actor required.' }, { status: 400 });
    }

    const release = await releasePayment(intentId, actor);
    return NextResponse.json(release);
  } catch (error) {
    console.error('[PAYMENT_RELEASE_ERROR]', error);
    return NextResponse.json({ error: 'Unable to release funds' }, { status: 500 });
  }
}
