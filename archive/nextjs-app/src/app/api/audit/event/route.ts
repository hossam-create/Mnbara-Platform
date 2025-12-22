import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event_type, user_id, page, legal_slug, timestamp } = body ?? {};

    if (event_type !== 'LEGAL_ACCEPTED' || !user_id || !page || !timestamp) {
      return NextResponse.json({ error: 'Invalid audit payload' }, { status: 400 });
    }

    const ipHeader = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : 'unknown';

    const payload = {
      event_type,
      user_id,
      page,
      legal_slug,
      timestamp,
      ip,
      received_at: new Date().toISOString(),
    };

    console.info('[AUDIT_EVENT]', payload);

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[AUDIT_EVENT_ERROR]', error);
    return NextResponse.json({ error: 'Unable to record audit event' }, { status: 500 });
  }
}
