import { releasePayment, refundPayment } from '@/services/payments/payment_intent.service';

const heldIntents = new Map<string, { reason: string; heldAt: string }>();
const bannedUsers = new Map<string, { reason: string; bannedAt: string; actor: string }>();

export function holdFunds(intentId: string, reason: string) {
  heldIntents.set(intentId, { reason, heldAt: new Date().toISOString() });
  return heldIntents.get(intentId);
}

export async function manualRelease(intentId: string, actor: string) {
  heldIntents.delete(intentId);
  return releasePayment(intentId, actor);
}

export async function manualPartialRefund(intentId: string, actor: string, amount: number) {
  return refundPayment(intentId, `Partial refund ${amount} initiated by ${actor}`);
}

export async function manualFullRefund(intentId: string, actor: string, reason: string) {
  heldIntents.delete(intentId);
  return refundPayment(intentId, `Full refund by ${actor}: ${reason}`);
}

export function banUser(userId: string, actor: string, reason: string) {
  bannedUsers.set(userId, { actor, reason, bannedAt: new Date().toISOString() });
  return bannedUsers.get(userId);
}

export function isUserBanned(userId: string | null | undefined) {
  if (!userId) return false;
  return bannedUsers.has(userId);
}

export function listHeldIntents() {
  return Array.from(heldIntents.entries()).map(([intentId, meta]) => ({ intentId, ...meta }));
}

export function listBannedUsers() {
  return Array.from(bannedUsers.entries()).map(([userId, meta]) => ({ userId, ...meta }));
}
