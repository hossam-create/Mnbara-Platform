import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/services/payments/payment_intent.service';
import type { PaymentMethod } from '@/services/payments/psp.adapter';
import { evaluateFraudSignals } from '@/services/security/fraud_signals.service';
import { logDeviceSecurityEvent } from '@/services/security/device_logger';
import { isUserBanned } from '@/services/security/admin_controls.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      customerId,
      amount,
      paymentMethod,
      buyerLegalName,
      buyerProvidedName,
      travelerId,
    } = body ?? {};

    if (!orderId || !customerId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'orderId, customerId, amount, paymentMethod required.' },
        { status: 400 },
      );
    }

    const ip =
      request.headers.get('x-forwarded-for') ??
      request.ip ??
      request.headers.get('x-real-ip') ??
      'unknown';
    const deviceFingerprint = request.headers.get('x-device-fingerprint');
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    const signals = evaluateFraudSignals({
      ip,
      deviceFingerprint,
      userAgent,
      buyerLegalName,
      buyerProvidedName,
      buyerId: customerId,
      travelerId,
    });

    if (isUserBanned(customerId)) {
      return NextResponse.json(
        { error: 'Buyer account banned. Contact Trust & Safety.', reasons: ['Permanent ban in effect'] },
        { status: 403 },
      );
    }

    logDeviceSecurityEvent({
      userId: customerId,
      orderId,
      ipAddress: ip,
      deviceFingerprint: deviceFingerprint ?? 'missing',
      userAgent,
      activity: 'payment_intent',
      reasons: signals.reasons,
    });

    if (signals.allowance === 'block') {
      return NextResponse.json(
        { error: 'Payment blocked pending fraud review', reasons: signals.reasons },
        { status: 403 },
      );
    }

    if (signals.allowance === 'manual_review') {
      return NextResponse.json(
        { error: 'Manual review required before payment intent', reasons: signals.reasons },
        { status: 412 },
      );
    }

    const intent = await createPaymentIntent({
      orderId,
      customerId,
      amount,
      paymentMethod: paymentMethod as PaymentMethod,
    });

    return NextResponse.json(intent);
  } catch (error) {
    console.error('[PAYMENT_INTENT_ERROR]', error);
    return NextResponse.json({ error: 'Unable to create intent' }, { status: 500 });
  }
}
