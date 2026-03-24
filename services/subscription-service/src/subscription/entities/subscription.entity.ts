export interface SubscriptionFeature {
  featureName: string;
  isLocked: boolean;
  requiredPlan: string;
  description: string;
  price?: number;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  reason?: string;
  requiredPlan?: string;
  currentPlan?: string;
  upgradeUrl?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: any;
  message: string;
}

export const PLAN_HIERARCHY: Record<string, number> = {
  premium: 5,
  'seller-pro': 4,
  'seller-basic': 3,
  basic: 2,
  free: 1,
};
