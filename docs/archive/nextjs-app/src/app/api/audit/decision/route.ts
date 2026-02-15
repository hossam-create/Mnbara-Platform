import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, confirmed_by, timestamp } = body ?? {};

    if (!user_id || !action || confirmed_by !== 'human') {
      return NextResponse.json({ error: 'Manual confirmation required.' }, { status: 400 });
    }

    const decision = {
      user_id,
      action,
      confirmed_by,
      timestamp: timestamp ?? new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown',
    };

    console.info('[AUDIT_DECISION]', decision);
    return NextResponse.json({ status: 'logged' });
  } catch (error) {
    console.error('[AUDIT_DECISION_ERROR]', error);
    return NextResponse.json({ error: 'Unable to record decision.' }, { status: 500 });
  }
}
