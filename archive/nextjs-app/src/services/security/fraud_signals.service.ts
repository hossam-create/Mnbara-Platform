type DeviceSignalInput = {
  ip?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  buyerLegalName?: string | null;
  buyerProvidedName?: string | null;
  buyerId?: string | null;
  travelerId?: string | null;
  profileStatus?: string | null;
  banReason?: string | null;
  riskScore?: number | null;
};

export type FraudSignalResult = {
  allowance: 'allow' | 'manual_review' | 'block';
  reasons: string[];
  deviceFingerprint?: string | null;
  ip?: string | null;
};

const { NEXT_PUBLIC_API_URL = 'http://localhost:3001/api' } = process.env;

function normalizeName(value?: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

/**
 * Request trusted buyer status and trust signals from backend.
 * Falls back to manual review if API unreachable.
 */
export async function fetchBuyerTrustSignals(
  token: string,
  deviceFingerprint?: string | null
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  if (deviceFingerprint) {
    headers['x-device-fingerprint'] = deviceFingerprint;
  }

  const resp = await fetch(`${NEXT_PUBLIC_API_URL}/buyer-trust/status`, {
    headers,
    cache: 'no-store',
  });

  if (!resp.ok) {
    throw new Error(`Buyer trust API failed with ${resp.status}`);
  }

  const payload = await resp.json();
  return payload.data;
}

export function evaluateFraudSignals(input: DeviceSignalInput): FraudSignalResult {
  const reasons: string[] = [];
  let allowance: FraudSignalResult['allowance'] = 'allow';

  if (!input.deviceFingerprint) {
    allowance = 'manual_review';
    reasons.push('Missing device fingerprint header');
  }

  if (!input.ip) {
    allowance = 'manual_review';
    reasons.push('Missing IP address');
  }

  const legal = normalizeName(input.buyerLegalName);
  const provided = normalizeName(input.buyerProvidedName);
  if (legal && provided && legal !== provided) {
    allowance = 'manual_review';
    reasons.push('Name mismatch requires KYC review');
  }

  if (input.profileStatus === 'BANNED' || input.banReason) {
    allowance = 'block';
    reasons.push('Buyer is banned until admin review');
  } else if (input.profileStatus && input.profileStatus !== 'VERIFIED') {
    allowance = 'manual_review';
    reasons.push(`Buyer profile status is ${input.profileStatus}`);
  }

  if (typeof input.riskScore === 'number' && input.riskScore >= 70) {
    allowance = 'block';
    reasons.push('Backend risk score exceeded threshold');
  } else if (typeof input.riskScore === 'number' && input.riskScore >= 40) {
    if (allowance === 'allow') allowance = 'manual_review';
    reasons.push('Backend risk score requires manual review');
  }

  if (input.travelerId && input.travelerId.startsWith('risk-')) {
    if (allowance === 'allow') allowance = 'manual_review';
    reasons.push('Traveler flagged from backend signals');
  }

  return {
    allowance,
    reasons,
    deviceFingerprint: input.deviceFingerprint,
    ip: input.ip,
  };
}
