import { RoleExpansionConfig, FulfillmentMethod } from '../types/RoleExpansion.types';

/**
 * Role Expansion Configuration
 * 
 * Environment variable overrides with sensible defaults
 * All settings configurable for different deployment environments
 */
export const roleExpansionConfig: RoleExpansionConfig = {
  // Approval requirements
  sellerApprovalRequired: process.env.ROLE_EXPANSION_SELLER_APPROVAL_REQUIRED === 'true',
  storeApprovalRequired: process.env.ROLE_EXPANSION_STORE_APPROVAL_REQUIRED === 'true',
  
  // Trust score requirements
  minimumBuyerTrustScore: parseInt(process.env.ROLE_EXPANSION_MIN_BUYER_TRUST_SCORE || '50'),
  
  // Default seller capabilities
  defaultSellerCapabilities: {
    canCreateAuctions: process.env.ROLE_EXPANSION_SELLER_CAN_CREATE_AUCTIONS !== 'false',
    canCreateListings: process.env.ROLE_EXPANSION_SELLER_CAN_CREATE_LISTINGS !== 'false',
    maxActiveListings: parseInt(process.env.ROLE_EXPANSION_SELLER_MAX_ACTIVE_LISTINGS || '50')
  },
  
  // Default store capabilities
  defaultStoreCapabilities: {
    canCreateAuctions: process.env.ROLE_EXPANSION_STORE_CAN_CREATE_AUCTIONS !== 'false',
    canCreateListings: process.env.ROLE_EXPANSION_STORE_CAN_CREATE_LISTINGS !== 'false',
    maxActiveListings: parseInt(process.env.ROLE_EXPANSION_STORE_MAX_ACTIVE_LISTINGS || '100')
  },
  
  // Auto-activation settings
  autoActivateSellers: process.env.ROLE_EXPANSION_AUTO_ACTIVATE_SELLERS === 'true',
  autoActivateStores: process.env.ROLE_EXPANSION_AUTO_ACTIVATE_STORES === 'true',
  
  // Verification requirements
  requireSellerVerification: process.env.ROLE_EXPANSION_REQUIRE_SELLER_VERIFICATION === 'true',
  requireStoreVerification: process.env.ROLE_EXPANSION_REQUIRE_STORE_VERIFICATION === 'true',
  
  // Supported fulfillment methods
  supportedFulfillmentMethods: (process.env.ROLE_EXPANSION_SUPPORTED_FULFILLMENT_METHODS?.split(',') || [
    FulfillmentMethod.TRAVELER_DELIVERY,
    FulfillmentMethod.DIRECT_SHIPPING,
    FulfillmentMethod.BOTH
  ]) as FulfillmentMethod[]
};

/**
 * Reload role expansion configuration from environment variables
 * Call this to update settings without restart
 */
export function reloadRoleExpansionConfig(): void {
  const newConfig: RoleExpansionConfig = {
    sellerApprovalRequired: process.env.ROLE_EXPANSION_SELLER_APPROVAL_REQUIRED === 'true',
    storeApprovalRequired: process.env.ROLE_EXPANSION_STORE_APPROVAL_REQUIRED === 'true',
    minimumBuyerTrustScore: parseInt(process.env.ROLE_EXPANSION_MIN_BUYER_TRUST_SCORE || '50'),
    defaultSellerCapabilities: {
      canCreateAuctions: process.env.ROLE_EXPANSION_SELLER_CAN_CREATE_AUCTIONS !== 'false',
      canCreateListings: process.env.ROLE_EXPANSION_SELLER_CAN_CREATE_LISTINGS !== 'false',
      maxActiveListings: parseInt(process.env.ROLE_EXPANSION_SELLER_MAX_ACTIVE_LISTINGS || '50')
    },
    defaultStoreCapabilities: {
      canCreateAuctions: process.env.ROLE_EXPANSION_STORE_CAN_CREATE_AUCTIONS !== 'false',
      canCreateListings: process.env.ROLE_EXPANSION_STORE_CAN_CREATE_LISTINGS !== 'false',
      maxActiveListings: parseInt(process.env.ROLE_EXPANSION_STORE_MAX_ACTIVE_LISTINGS || '100')
    },
    autoActivateSellers: process.env.ROLE_EXPANSION_AUTO_ACTIVATE_SELLERS === 'true',
    autoActivateStores: process.env.ROLE_EXPANSION_AUTO_ACTIVATE_STORES === 'true',
    requireSellerVerification: process.env.ROLE_EXPANSION_REQUIRE_SELLER_VERIFICATION === 'true',
    requireStoreVerification: process.env.ROLE_EXPANSION_REQUIRE_STORE_VERIFICATION === 'true',
    supportedFulfillmentMethods: (process.env.ROLE_EXPANSION_SUPPORTED_FULFILLMENT_METHODS?.split(',') || [
      FulfillmentMethod.TRAVELER_DELIVERY,
      FulfillmentMethod.DIRECT_SHIPPING,
      FulfillmentMethod.BOTH
    ]) as FulfillmentMethod[]
  };
  
  // Update config object
  Object.assign(roleExpansionConfig, newConfig);
  
  console.log('[RoleExpansion] Configuration reloaded:', newConfig);
}

/**
 * Validate role expansion configuration
 */
export function validateRoleExpansionConfig(): boolean {
  const config = roleExpansionConfig;
  
  if (config.minimumBuyerTrustScore < 0 || config.minimumBuyerTrustScore > 100) {
    console.error('[RoleExpansion] Invalid minimumBuyerTrustScore:', config.minimumBuyerTrustScore);
    return false;
  }
  
  if (config.defaultSellerCapabilities.maxActiveListings < 1) {
    console.error('[RoleExpansion] Invalid seller maxActiveListings:', config.defaultSellerCapabilities.maxActiveListings);
    return false;
  }
  
  if (config.defaultStoreCapabilities.maxActiveListings < 1) {
    console.error('[RoleExpansion] Invalid store maxActiveListings:', config.defaultStoreCapabilities.maxActiveListings);
    return false;
  }
  
  const validFulfillmentMethods = [FulfillmentMethod.TRAVELER_DELIVERY, FulfillmentMethod.DIRECT_SHIPPING, FulfillmentMethod.BOTH];
  const invalidMethods = config.supportedFulfillmentMethods.filter(method => !validFulfillmentMethods.includes(method));
  if (invalidMethods.length > 0) {
    console.error('[RoleExpansion] Invalid fulfillment methods:', invalidMethods);
    return false;
  }
  
  return true;
}

/**
 * Check if seller approval is required
 */
export function isSellerApprovalRequired(): boolean {
  return roleExpansionConfig.sellerApprovalRequired;
}

/**
 * Check if store approval is required
 */
export function isStoreApprovalRequired(): boolean {
  return roleExpansionConfig.storeApprovalRequired;
}

/**
 * Check if buyer trust score is sufficient for seller role
 */
export function isBuyerTrustScoreSufficient(trustScore: number): boolean {
  return trustScore >= roleExpansionConfig.minimumBuyerTrustScore;
}

/**
 * Check if seller auto-activation is enabled
 */
export function isSellerAutoActivationEnabled(): boolean {
  return roleExpansionConfig.autoActivateSellers;
}

/**
 * Check if store auto-activation is enabled
 */
export function isStoreAutoActivationEnabled(): boolean {
  return roleExpansionConfig.autoActivateStores;
}

/**
 * Check if seller verification is required
 */
export function isSellerVerificationRequired(): boolean {
  return roleExpansionConfig.requireSellerVerification;
}

/**
 * Check if store verification is required
 */
export function isStoreVerificationRequired(): boolean {
  return roleExpansionConfig.requireStoreVerification;
}

/**
 * Check if fulfillment method is supported
 */
export function isFulfillmentMethodSupported(method: FulfillmentMethod): boolean {
  return roleExpansionConfig.supportedFulfillmentMethods.includes(method);
}

/**
 * Get default seller capabilities
 */
export function getDefaultSellerCapabilities() {
  return { ...roleExpansionConfig.defaultSellerCapabilities };
}

/**
 * Get default store capabilities
 */
export function getDefaultStoreCapabilities() {
  return { ...roleExpansionConfig.defaultStoreCapabilities };
}

/**
 * Validate seller application data
 */
export function validateSellerApplication(data: any): { valid: boolean; error?: string } {
  if (!data.displayName || data.displayName.trim().length === 0) {
    return { valid: false, error: 'Display name is required' };
  }
  
  if (!data.country || data.country.trim().length === 0) {
    return { valid: false, error: 'Country is required' };
  }
  
  if (!data.contactEmail || data.contactEmail.trim().length === 0) {
    return { valid: false, error: 'Contact email is required' };
  }
  
  if (!data.fulfillmentType || !Object.values(FulfillmentMethod).includes(data.fulfillmentType)) {
    return { valid: false, error: 'Valid fulfillment type is required' };
  }
  
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    return { valid: false, error: 'Invalid contact email format' };
  }
  
  return { valid: true };
}

/**
 * Validate store creation data
 */
export function validateStoreCreation(data: any): { valid: boolean; error?: string } {
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Store name is required' };
  }
  
  if (!data.slug || data.slug.trim().length === 0) {
    return { valid: false, error: 'Store slug is required' };
  }
  
  if (!data.description || data.description.trim().length === 0) {
    return { valid: false, error: 'Store description is required' };
  }
  
  if (!data.country || data.country.trim().length === 0) {
    return { valid: false, error: 'Country is required' };
  }
  
  if (!data.contactEmail || data.contactEmail.trim().length === 0) {
    return { valid: false, error: 'Contact email is required' };
  }
  
  if (!data.fulfillmentType || !Object.values(FulfillmentMethod).includes(data.fulfillmentType)) {
    return { valid: false, error: 'Valid fulfillment type is required' };
  }
  
  if (data.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) {
    return { valid: false, error: 'Invalid contact email format' };
  }
  
  // Validate slug format (alphanumeric, hyphens, underscores only)
  if (data.slug && !/^[a-zA-Z0-9_-]+$/.test(data.slug)) {
    return { valid: false, error: 'Store slug can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { valid: true };
}

/**
 * Validate fulfillment method data
 */
export function validateFulfillmentMethod(data: any): { valid: boolean; error?: string } {
  if (!data.sellerId || data.sellerId.trim().length === 0) {
    return { valid: false, error: 'Seller ID is required' };
  }
  
  if (!data.listingId || data.listingId.trim().length === 0) {
    return { valid: false, error: 'Listing ID is required' };
  }
  
  if (!data.method || !Object.values(FulfillmentMethod).includes(data.method)) {
    return { valid: false, error: 'Valid fulfillment method is required' };
  }
  
  if (!data.configuration) {
    return { valid: false, error: 'Configuration is required' };
  }
  
  // Validate traveler delivery configuration
  if (data.method === FulfillmentMethod.TRAVELER_DELIVERY || data.method === FulfillmentMethod.BOTH) {
    if (data.configuration.travelerDelivery) {
      const travelerConfig = data.configuration.travelerDelivery;
      if (travelerConfig.maxDistance && travelerConfig.maxDistance <= 0) {
        return { valid: false, error: 'Max distance must be positive' };
      }
      if (travelerConfig.deliveryTime && travelerConfig.deliveryTime <= 0) {
        return { valid: false, error: 'Delivery time must be positive' };
      }
    }
  }
  
  // Validate direct shipping configuration
  if (data.method === FulfillmentMethod.DIRECT_SHIPPING || data.method === FulfillmentMethod.BOTH) {
    if (data.configuration.directShipping) {
      const shippingConfig = data.configuration.directShipping;
      if (shippingConfig.shippingZones && Array.isArray(shippingConfig.shippingZones)) {
        for (const zone of shippingConfig.shippingZones) {
          if (!zone.zone || zone.cost < 0 || zone.estimatedDays <= 0) {
            return { valid: false, error: 'Invalid shipping zone configuration' };
          }
        }
      }
    }
  }
  
  return { valid: true };
}

// Validate configuration on startup
if (!validateRoleExpansionConfig()) {
  throw new Error('[RoleExpansion] Invalid configuration detected');
}
