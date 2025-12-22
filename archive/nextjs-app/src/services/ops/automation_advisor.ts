import { mockOrders, type MarketplaceOrder } from '@/data/orders';

const DELIVERY_ALERT_GRACE_DAYS = 2; // days after due date
const BUYER_INACTIVE_DAYS = 5;

export type AutomationSuggestionType = 'delivery_overdue' | 'buyer_inactive' | 'risk_flag';

export type AutomationSuggestion = {
  id: string;
  orderId: string;
  type: AutomationSuggestionType;
  severity: 'low' | 'medium' | 'high';
  title: string;
  summary: string;
  recommendedAction: string;
  requiresHuman: true;
  timer?: {
    triggeredAt: string;
    nextReminderAt: string;
  };
  corridorRisk: MarketplaceOrder['corridorRisk'];
  metadata: Record<string, string | number>;
};

export type AutomationReport = {
  generatedAt: string;
  suggestions: AutomationSuggestion[];
};

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

function buildDeliveryOverdueSuggestion(order: MarketplaceOrder, now: Date): AutomationSuggestion | null {
  const due = new Date(order.deliveryDueDate);
  if (order.status !== 'awaiting_delivery') return null;
  if (now <= due) return null;

  const daysOverdue = daysBetween(due, now);
  if (daysOverdue < DELIVERY_ALERT_GRACE_DAYS) return null;

  return {
    id: `${order.id}-delivery-overdue`,
    orderId: order.id,
    type: 'delivery_overdue',
    severity: daysOverdue > 5 ? 'high' : 'medium',
    title: 'Delivery overdue — alert admin',
    summary: `${order.listingTitle} is overdue by ${daysOverdue} days. Traveler ${order.travelerName} still shows "awaiting delivery" status.`,
    recommendedAction: 'Verify proof of delivery and escalate to dispute desk if traveler is unresponsive.',
    requiresHuman: true,
    timer: {
      triggeredAt: due.toISOString(),
      nextReminderAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    },
    corridorRisk: order.corridorRisk,
    metadata: {
      traveler: order.travelerName,
      buyer: order.buyerName,
      daysOverdue,
    },
  };
}

function buildBuyerInactiveSuggestion(order: MarketplaceOrder, now: Date): AutomationSuggestion | null {
  const lastBuyer = new Date(order.lastBuyerActionAt);
  const inactiveDays = daysBetween(lastBuyer, now);
  if (inactiveDays < BUYER_INACTIVE_DAYS) return null;

  return {
    id: `${order.id}-buyer-inactive`,
    orderId: order.id,
    type: 'buyer_inactive',
    severity: 'medium',
    title: 'Buyer inactive — draft reminder',
    summary: `${order.buyerName} has been inactive for ${inactiveDays} days. Delivery due ${new Date(
      order.deliveryDueDate,
    ).toLocaleDateString()}.`,
    recommendedAction: 'Send manual reminder email / SMS referencing the PSP-secured funds and require confirmation.',
    requiresHuman: true,
    timer: {
      triggeredAt: lastBuyer.toISOString(),
      nextReminderAt: new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString(),
    },
    corridorRisk: order.corridorRisk,
    metadata: {
      inactiveDays,
    },
  };
}

function buildRiskFlagSuggestion(order: MarketplaceOrder): AutomationSuggestion | null {
  if (order.corridorRisk !== 'high') return null;

  return {
    id: `${order.id}-risk-flag`,
    orderId: order.id,
    type: 'risk_flag',
    severity: 'high',
    title: 'High-risk corridor — escalate for review',
    summary: `${order.listingTitle} involves a high-risk corridor. Ensure delivery evidence and traveler identity checks are completed before release.`,
    recommendedAction: 'Assign to Trust & Safety analyst to verify traveler itinerary and require dual confirmation before release.',
    requiresHuman: true,
    corridorRisk: order.corridorRisk,
    metadata: {
      traveler: order.travelerName,
      paymentIntentId: order.paymentIntentId,
    },
  };
}

export function generateAutomationSuggestions(now: Date = new Date()): AutomationReport {
  const suggestions: AutomationSuggestion[] = [];

  for (const order of mockOrders) {
    const delivery = buildDeliveryOverdueSuggestion(order, now);
    if (delivery) suggestions.push(delivery);

    const buyer = buildBuyerInactiveSuggestion(order, now);
    if (buyer) suggestions.push(buyer);

    const risk = buildRiskFlagSuggestion(order);
    if (risk) suggestions.push(risk);
  }

  return {
    generatedAt: now.toISOString(),
    suggestions,
  };
}
