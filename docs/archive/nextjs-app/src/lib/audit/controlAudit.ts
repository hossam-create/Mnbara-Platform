type BaseAuditPayload = {
  userId: string;
  timestamp?: string;
  sourceIp?: string;
};

const eventEndpoint = '/api/audit/event';
const decisionEndpoint = '/api/audit/decision';

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Audit request failed (${response.status}): ${error}`);
  }
}

export async function logLegalConsent(payload: BaseAuditPayload & { page: string; legalSlug: string }) {
  await postJson(eventEndpoint, {
    event_type: 'LEGAL_ACCEPTED',
    user_id: payload.userId,
    page: payload.page,
    legal_slug: payload.legalSlug,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    source_ip: payload.sourceIp,
  });
}

export async function logManualDecision(
  payload: BaseAuditPayload & {
    action: string;
    confirmedBy: 'human';
  }
) {
  await postJson(decisionEndpoint, {
    user_id: payload.userId,
    action: payload.action,
    confirmed_by: payload.confirmedBy,
    timestamp: payload.timestamp ?? new Date().toISOString(),
    source_ip: payload.sourceIp,
  });
}
