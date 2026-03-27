import { SellerProtectionConfig } from '../types/SellerProtection.types';

/**
 * Seller Protection Configuration
 * 
 * Environment variable overrides with sensible defaults
 * All settings configurable for different deployment environments
 */
export const sellerProtectionConfig: SellerProtectionConfig = {
  // Auto-relist settings
  autoRelistEnabled: process.env.SELLER_PROTECTION_AUTO_RELIST_ENABLED === 'true',
  requireSellerConfirmation: process.env.SELLER_PROTECTION_REQUIRE_CONFIRMATION === 'true',
  autoRelistStartStatus: (process.env.SELLER_PROTECTION_START_STATUS as 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE') || 'PENDING_REVIEW',
  
  // Timing settings
  confirmationDeadlineHours: parseInt(process.env.SELLER_PROTECTION_CONFIRMATION_DEADLINE_HOURS || '72'),
  autoRelistCooldownHours: parseInt(process.env.SELLER_PROTECTION_COOLDOWN_HOURS || '24'),
  
  // Limits
  maxAutoRelistPerSeller: parseInt(process.env.SELLER_PROTECTION_MAX_AUTO_RELIST || '5'),
  
  // Trust and escrow
  protectedSellerTrustScoreImpact: (process.env.SELLER_PROTECTION_TRUST_IMPACT as 'NONE' | 'POSITIVE' | 'NEGATIVE') || 'NONE',
  allowAutoRelistAfterAppeal: process.env.SELLER_PROTECTION_ALLOW_RELIST_AFTER_APPEAL === 'true',
  
  // Data copying settings
  copyReservePrice: process.env.SELLER_PROTECTION_COPY_RESERVE_PRICE === 'true',
  copyShippingInfo: process.env.SELLER_PROTECTION_COPY_SHIPPING_INFO === 'true'
};

/**
 * Reload seller protection configuration from environment variables
 * Call this to update settings without restart
 */
export function reloadSellerProtectionConfig(): void {
  const newConfig: SellerProtectionConfig = {
    autoRelistEnabled: process.env.SELLER_PROTECTION_AUTO_RELIST_ENABLED === 'true',
    requireSellerConfirmation: process.env.SELLER_PROTECTION_REQUIRE_CONFIRMATION === 'true',
    autoRelistStartStatus: (process.env.SELLER_PROTECTION_START_STATUS as 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE') || 'PENDING_REVIEW',
    confirmationDeadlineHours: parseInt(process.env.SELLER_PROTECTION_CONFIRMATION_DEADLINE_HOURS || '72'),
    autoRelistCooldownHours: parseInt(process.env.SELLER_PROTECTION_COOLDOWN_HOURS || '24'),
    maxAutoRelistPerSeller: parseInt(process.env.SELLER_PROTECTION_MAX_AUTO_RELIST || '5'),
    protectedSellerTrustScoreImpact: (process.env.SELLER_PROTECTION_TRUST_IMPACT as 'NONE' | 'POSITIVE' | 'NEGATIVE') || 'NONE',
    allowAutoRelistAfterAppeal: process.env.SELLER_PROTECTION_ALLOW_RELIST_AFTER_APPEAL === 'true',
    copyReservePrice: process.env.SELLER_PROTECTION_COPY_RESERVE_PRICE === 'true',
    copyShippingInfo: process.env.SELLER_PROTECTION_COPY_SHIPPING_INFO === 'true'
  };
  
  // Update config object
  Object.assign(sellerProtectionConfig, newConfig);
  
  console.log('[SellerProtection] Configuration reloaded:', newConfig);
}

/**
 * Validate seller protection configuration
 */
export function validateSellerProtectionConfig(): boolean {
  const config = sellerProtectionConfig;
  
  if (config.confirmationDeadlineHours < 1) {
    console.error('[SellerProtection] Invalid confirmationDeadlineHours:', config.confirmationDeadlineHours);
    return false;
  }
  
  if (config.confirmationDeadlineHours > 168) { // 7 days max
    console.error('[SellerProtection] confirmationDeadlineHours cannot exceed 168 (7 days)');
    return false;
  }
  
  if (config.autoRelistCooldownHours < 0) {
    console.error('[SellerProtection] autoRelistCooldownHours cannot be negative:', config.autoRelistCooldownHours);
    return false;
  }
  
  if (config.maxAutoRelistPerSeller < 0) {
    console.error('[SellerProtection] maxAutoRelistPerSeller cannot be negative:', config.maxAutoRelistPerSeller);
    return false;
  }
  
  const validStartStatuses = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE'];
  if (!validStartStatuses.includes(config.autoRelistStartStatus)) {
    console.error('[SellerProtection] Invalid autoRelistStartStatus:', config.autoRelistStartStatus);
    return false;
  }
  
  const validTrustImpacts = ['NONE', 'POSITIVE', 'NEGATIVE'];
  if (!validTrustImpacts.includes(config.protectedSellerTrustScoreImpact)) {
    console.error('[SellerProtection] Invalid protectedSellerTrustScoreImpact:', config.protectedSellerTrustScoreImpact);
    return false;
  }
  
  return true;
}

/**
 * Get confirmation deadline in milliseconds
 */
export function getConfirmationDeadlineDuration(): number {
  return sellerProtectionConfig.confirmationDeadlineHours * 60 * 60 * 1000;
}

/**
 * Get auto-relist cooldown duration in milliseconds
 */
export function getAutoRelistCooldownDuration(): number {
  return sellerProtectionConfig.autoRelistCooldownHours * 60 * 60 * 1000;
}

/**
 * Check if auto-relist is enabled
 */
export function isAutoRelistEnabled(): boolean {
  return sellerProtectionConfig.autoRelistEnabled;
}

/**
 * Check if seller confirmation is required
 */
export function requiresSellerConfirmation(): boolean {
  return sellerProtectionConfig.requireSellerConfirmation;
}

/**
 * Check if appeal-based auto-relist is allowed
 */
export function allowsAutoRelistAfterAppeal(): boolean {
  return sellerProtectionConfig.allowAutoRelistAfterAppeal;
}

/**
 * Validate auto-relist request data
 */
export function validateAutoRelistRequest(data: any): { valid: boolean; error?: string } {
  if (!data.sellerProtectionId) {
    return { valid: false, error: 'Seller protection ID is required' };
  }
  
  if (typeof data.requireConfirmation !== 'boolean') {
    return { valid: false, error: 'requireConfirmation must be boolean' };
  }
  
  const validStartStatuses = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE'];
  if (data.startStatus && !validStartStatuses.includes(data.startStatus)) {
    return { 
      valid: false, 
      error: `startStatus must be one of: ${validStartStatuses.join(', ')}` 
    };
  }
  
  if (data.scheduledAt && !(data.scheduledAt instanceof Date) && isNaN(Date.parse(data.scheduledAt))) {
    return { valid: false, error: 'scheduledAt must be a valid date' };
  }
  
  return { valid: true };
}

// Validate configuration on startup
if (!validateSellerProtectionConfig()) {
  throw new Error('[SellerProtection] Invalid configuration detected');
}
