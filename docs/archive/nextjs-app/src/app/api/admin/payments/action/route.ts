import { NextRequest, NextResponse } from 'next/server';
import {
  holdFunds,
  manualRelease,
  manualPartialRefund,
  manualFullRefund,
  banUser,
} from '@/services/security/admin_controls.service';

type AdminAction =
  | { action: 'hold'; intentId: string; reason: string }
  | { action: 'release'; intentId: string; actor: string }
  | { action: 'partial_refund'; intentId: string; actor: string; amount: number }
  | { action: 'full_refund'; intentId: string; actor: string; reason: string }
  | { action: 'ban_user'; userId: string; actor: string; reason: string };

function validatePayload(body: any): AdminAction | null {
  switch (body?.action) {
    case 'hold':
      if (body.intentId && body.reason) return body as AdminAction;
      break;
    case 'release':
      if (body.intentId && body.actor) return body as AdminAction;
      break;
    case 'partial_refund':
      if (body.intentId && body.actor && typeof body.amount === 'number') return body as AdminAction;
      break;
    case 'full_refund':
      if (body.intentId && body.actor && body.reason) return body as AdminAction;
      break;
    case 'ban_user':
      if (body.userId && body.actor && body.reason) return body as AdminAction;
      break;
    default:
      break;
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const action = validatePayload(payload);

    if (!action) {
      return NextResponse.json({ error: 'Invalid admin action payload' }, { status: 400 });
    }

    switch (action.action) {
      case 'hold':
        return NextResponse.json({ status: 'held', data: holdFunds(action.intentId, action.reason) });
      case 'release':
        return NextResponse.json({ status: 'released', data: await manualRelease(action.intentId, action.actor) });
      case 'partial_refund':
        return NextResponse.json({
          status: 'partial_refund',
          data: await manualPartialRefund(action.intentId, action.actor, action.amount),
        });
      case 'full_refund':
        return NextResponse.json({
          status: 'full_refund',
          data: await manualFullRefund(action.intentId, action.actor, action.reason),
        });
      case 'ban_user':
        return NextResponse.json({ status: 'banned', data: banUser(action.userId, action.actor, action.reason) });
      default:
        return NextResponse.json({ error: 'Unsupported admin action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[ADMIN_PAYMENT_ACTION_ERROR]', error);
    return NextResponse.json({ error: 'Unable to process admin action' }, { status: 500 });
  }
}
