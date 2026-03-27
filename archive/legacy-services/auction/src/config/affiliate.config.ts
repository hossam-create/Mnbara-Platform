import { AffiliateConfig, ReferralTargetType, ReferralActionType } from '../types/Affiliate.types';

/**
 * Affiliate & Referral Configuration
 * 
 * Environment variable overrides with sensible defaults
 * All settings configurable for different deployment environments
 */
export const affiliateConfig: AffiliateConfig = {
  // Attribution settings
  attributionWindow: parseInt(process.env.AFFILIATE_ATTRIBUTION_WINDOW_DAYS || '30'),
  
  // Referral link limits
  maxActiveReferralLinks: parseInt(process.env.AFFILIATE_MAX_ACTIVE_REFERRAL_LINKS || '50'),
  
  // Supported target types
  supportedTargetTypes: (process.env.AFFILIATE_SUPPORTED_TARGET_TYPES?.split(',') || [
    ReferralTargetType.PRODUCT,
    ReferralTargetType.AUCTION,
    ReferralTargetType.STORE,
    ReferralTargetType.CATEGORY
  ]) as ReferralTargetType[],
  
  // Affiliate activation
  autoActivateAffiliates: process.env.AFFILIATE_AUTO_ACTIVATE === 'true',
  requireTrustScore: process.env.AFFILIATE_REQUIRE_TRUST_SCORE === 'true',
  minimumTrustScore: parseInt(process.env.AFFILIATE_MINIMUM_TRUST_SCORE || '50'),
  
  // Commission eligibility rules
  commissionEligibilityRules: {
    purchaseCompleted: process.env.AFFILIATE_COMMISSION_PURCHASE_COMPLETED === 'true',
    bidPlaced: process.env.AFFILIATE_COMMISSION_BID_PLACED === 'true',
    view: process.env.AFFILIATE_COMMISSION_VIEW === 'false',
    click: process.env.AFFILIATE_COMMISSION_CLICK === 'false'
  },
  
  // Commission rates (percentages)
  commissionRates: {
    [ReferralTargetType.PRODUCT]: {
      [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_CLICK || '0'),
      [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_VIEW || '0'),
      [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_BID || '2'),
      [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_PURCHASE || '5')
    },
    [ReferralTargetType.AUCTION]: {
      [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_CLICK || '0'),
      [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_VIEW || '0'),
      [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_BID || '3'),
      [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_PURCHASE || '6')
    },
    [ReferralTargetType.STORE]: {
      [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_CLICK || '0'),
      [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_VIEW || '0'),
      [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_BID || '1'),
      [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_PURCHASE || '4')
    },
    [ReferralTargetType.CATEGORY]: {
      [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_CLICK || '0'),
      [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_VIEW || '0'),
      [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_BID || '1'),
      [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_PURCHASE || '3')
    }
  }
};

/**
 * Reload affiliate configuration from environment variables
 * Call this to update settings without restart
 */
export function reloadAffiliateConfig(): void {
  const newConfig: AffiliateConfig = {
    attributionWindow: parseInt(process.env.AFFILIATE_ATTRIBUTION_WINDOW_DAYS || '30'),
    maxActiveReferralLinks: parseInt(process.env.AFFILIATE_MAX_ACTIVE_REFERRAL_LINKS || '50'),
    supportedTargetTypes: (process.env.AFFILIATE_SUPPORTED_TARGET_TYPES?.split(',') || [
      ReferralTargetType.PRODUCT,
      ReferralTargetType.AUCTION,
      ReferralTargetType.STORE,
      ReferralTargetType.CATEGORY
    ]) as ReferralTargetType[],
    autoActivateAffiliates: process.env.AFFILIATE_AUTO_ACTIVATE === 'true',
    requireTrustScore: process.env.AFFILIATE_REQUIRE_TRUST_SCORE === 'true',
    minimumTrustScore: parseInt(process.env.AFFILIATE_MINIMUM_TRUST_SCORE || '50'),
    commissionEligibilityRules: {
      purchaseCompleted: process.env.AFFILIATE_COMMISSION_PURCHASE_COMPLETED === 'true',
      bidPlaced: process.env.AFFILIATE_COMMISSION_BID_PLACED === 'true',
      view: process.env.AFFILIATE_COMMISSION_VIEW === 'false',
      click: process.env.AFFILIATE_COMMISSION_CLICK === 'false'
    },
    commissionRates: {
      [ReferralTargetType.PRODUCT]: {
        [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_CLICK || '0'),
        [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_VIEW || '0'),
        [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_BID || '2'),
        [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_PRODUCT_PURCHASE || '5')
      },
      [ReferralTargetType.AUCTION]: {
        [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_CLICK || '0'),
        [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_VIEW || '0'),
        [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_BID || '3'),
        [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_AUCTION_PURCHASE || '6')
      },
      [ReferralTargetType.STORE]: {
        [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_CLICK || '0'),
        [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_VIEW || '0'),
        [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_BID || '1'),
        [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_STORE_PURCHASE || '4')
      },
      [ReferralTargetType.CATEGORY]: {
        [ReferralActionType.CLICK]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_CLICK || '0'),
        [ReferralActionType.VIEW]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_VIEW || '0'),
        [ReferralActionType.BID_PLACED]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_BID || '1'),
        [ReferralActionType.PURCHASE_COMPLETED]: parseFloat(process.env.AFFILIATE_COMMISSION_CATEGORY_PURCHASE || '3')
      }
    }
  };
  
  // Update config object
  Object.assign(affiliateConfig, newConfig);
  
  console.log('[Affiliate] Configuration reloaded:', newConfig);
}

/**
 * Validate affiliate configuration
 */
export function validateAffiliateConfig(): boolean {
  const config = affiliateConfig;
  
  if (config.attributionWindow < 1 || config.attributionWindow > 365) {
    console.error('[Affiliate] Invalid attributionWindow:', config.attributionWindow);
    return false;
  }
  
  if (config.maxActiveReferralLinks < 1) {
    console.error('[Affiliate] Invalid maxActiveReferralLinks:', config.maxActiveReferralLinks);
    return false;
  }
  
  if (config.minimumTrustScore < 0 || config.minimumTrustScore > 100) {
    console.error('[Affiliate] Invalid minimumTrustScore:', config.minimumTrustScore);
    return false;
  }
  
  const validTargetTypes = [ReferralTargetType.PRODUCT, ReferralTargetType.AUCTION, ReferralTargetType.STORE, ReferralTargetType.CATEGORY];
  const invalidTargetTypes = config.supportedTargetTypes.filter(type => !validTargetTypes.includes(type));
  if (invalidTargetTypes.length > 0) {
    console.error('[Affiliate] Invalid target types:', invalidTargetTypes);
    return false;
  }
  
  // Validate commission rates
  for (const targetType of validTargetTypes) {
    for (const actionType of [ReferralActionType.CLICK, ReferralActionType.VIEW, ReferralActionType.BID_PLACED, ReferralActionType.PURCHASE_COMPLETED]) {
      const rate = config.commissionRates[targetType][actionType];
      if (rate < 0 || rate > 100) {
        console.error(`[Affiliate] Invalid commission rate for ${targetType}/${actionType}:`, rate);
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Check if auto-activation is enabled
 */
export function isAutoActivationEnabled(): boolean {
  return affiliateConfig.autoActivateAffiliates;
}

/**
 * Check if trust score is required
 */
export function isTrustScoreRequired(): boolean {
  return affiliateConfig.requireTrustScore;
}

/**
 * Check if trust score is sufficient
 */
export function isTrustScoreSufficient(trustScore: number): boolean {
  return trustScore >= affiliateConfig.minimumTrustScore;
}

/**
 * Check if target type is supported
 */
export function isTargetTypeSupported(targetType: ReferralTargetType): boolean {
  return affiliateConfig.supportedTargetTypes.includes(targetType);
}

/**
 * Get commission rate for target type and action
 */
export function getCommissionRate(targetType: ReferralTargetType, actionType: ReferralActionType): number {
  return affiliateConfig.commissionRates[targetType]?.[actionType] || 0;
}

/**
 * Check if action is eligible for commission
 */
export function isCommissionEligible(actionType: ReferralActionType): boolean {
  const rules = affiliateConfig.commissionEligibilityRules;
  switch (actionType) {
    case ReferralActionType.PURCHASE_COMPLETED:
      return rules.purchaseCompleted;
    case ReferralActionType.BID_PLACED:
      return rules.bidPlaced;
    case ReferralActionType.VIEW:
      return rules.view;
    case ReferralActionType.CLICK:
      return rules.click;
    default:
      return false;
  }
}

/**
 * Get attribution window in milliseconds
 */
export function getAttributionWindowMs(): number {
  return affiliateConfig.attributionWindow * 24 * 60 * 60 * 1000; // days to milliseconds
}

/**
 * Get max active referral links
 */
export function getMaxActiveReferralLinks(): number {
  return affiliateConfig.maxActiveReferralLinks;
}

/**
 * Get supported target types
 */
export function getSupportedTargetTypes(): ReferralTargetType[] {
  return [...affiliateConfig.supportedTargetTypes];
}

/**
 * Validate referral link request
 */
export function validateReferralLinkRequest(data: any): { valid: boolean; error?: string } {
  if (!data.targetType || !Object.values(ReferralTargetType).includes(data.targetType)) {
    return { valid: false, error: 'Valid target type is required' };
  }
  
  if (!data.targetId || data.targetId.trim().length === 0) {
    return { valid: false, error: 'Target ID is required' };
  }
  
  if (!data.targetMetadata || !data.targetMetadata.targetTitle || data.targetMetadata.targetTitle.trim().length === 0) {
    return { valid: false, error: 'Target title is required' };
  }
  
  if (!data.targetMetadata.targetUrl || data.targetMetadata.targetUrl.trim().length === 0) {
    return { valid: false, error: 'Target URL is required' };
  }
  
  // Check if target type is supported
  if (!isTargetTypeSupported(data.targetType)) {
    return { valid: false, error: 'Target type not supported' };
  }
  
  return { valid: true };
}

/**
 * Validate attribution request
 */
export function validateAttributionRequest(data: any): { valid: boolean; error?: string } {
  if (!data.referralCode || data.referralCode.trim().length === 0) {
    return { valid: false, error: 'Referral code is required' };
  }
  
  if (!data.actionType || !Object.values(ReferralActionType).includes(data.actionType)) {
    return { valid: false, error: 'Valid action type is required' };
  }
  
  if (!data.user || !data.user.ipAddress || data.user.ipAddress.trim().length === 0) {
    return { valid: false, error: 'User IP address is required' };
  }
  
  return { valid: true };
}

/**
 * Generate referral code
 */
export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Check if referral code is valid format
 */
export function isValidReferralCodeFormat(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}

// Validate configuration on startup
if (!validateAffiliateConfig()) {
  throw new Error('[Affiliate] Invalid configuration detected');
}
