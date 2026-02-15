import { MarketplaceConfig } from '../types/Marketplace.types';

/**
 * Marketplace Configuration
 * 
 * Environment variable overrides with sensible defaults
 * All settings configurable for different deployment environments
 */
export const marketplaceConfig: MarketplaceConfig = {
  // Request and offer timing
  buyerRequestTTLHours: parseInt(process.env.MARKETPLACE_BUYER_REQUEST_TTL_HOURS || '168'), // 7 days default
  offerTTLHours: parseInt(process.env.MARKETPLACE_OFFER_TTL_HOURS || '72'), // 3 days default
  
  // Limits and constraints
  maxOffersPerRequest: parseInt(process.env.MARKETPLACE_MAX_OFFERS_PER_REQUEST || '10'),
  maxActiveRequestsPerBuyer: parseInt(process.env.MARKETPLACE_MAX_ACTIVE_REQUESTS_PER_BUYER || '5'),
  maxActiveAvailabilitiesPerTraveler: parseInt(process.env.MARKETPLACE_MAX_ACTIVE_AVAILABILITIES_PER_TRAVELER || '3'),
  
  // Trust and matching
  minTrustScoreForMatching: parseInt(process.env.MARKETPLACE_MIN_TRUST_SCORE_FOR_MATCHING || '50'),
  allowAutoMatching: process.env.MARKETPLACE_ALLOW_AUTO_MATCHING === 'true',
  
  // Features
  enableNotifications: process.env.MARKETPLACE_ENABLE_NOTIFICATIONS === 'true',
  
  // Defaults
  defaultCurrency: process.env.MARKETPLACE_DEFAULT_CURRENCY || 'USD'
};

/**
 * Reload marketplace configuration from environment variables
 * Call this to update settings without restart
 */
export function reloadMarketplaceConfig(): void {
  const newConfig: MarketplaceConfig = {
    buyerRequestTTLHours: parseInt(process.env.MARKETPLACE_BUYER_REQUEST_TTL_HOURS || '168'),
    offerTTLHours: parseInt(process.env.MARKETPLACE_OFFER_TTL_HOURS || '72'),
    maxOffersPerRequest: parseInt(process.env.MARKETPLACE_MAX_OFFERS_PER_REQUEST || '10'),
    maxActiveRequestsPerBuyer: parseInt(process.env.MARKETPLACE_MAX_ACTIVE_REQUESTS_PER_BUYER || '5'),
    maxActiveAvailabilitiesPerTraveler: parseInt(process.env.MARKETPLACE_MAX_ACTIVE_AVAILABILITIES_PER_TRAVELER || '3'),
    minTrustScoreForMatching: parseInt(process.env.MARKETPLACE_MIN_TRUST_SCORE_FOR_MATCHING || '50'),
    allowAutoMatching: process.env.MARKETPLACE_ALLOW_AUTO_MATCHING === 'true',
    enableNotifications: process.env.MARKETPLACE_ENABLE_NOTIFICATIONS === 'true',
    defaultCurrency: process.env.MARKETPLACE_DEFAULT_CURRENCY || 'USD'
  };
  
  // Update config object
  Object.assign(marketplaceConfig, newConfig);
  
  console.log('[Marketplace] Configuration reloaded:', newConfig);
}

/**
 * Validate marketplace configuration
 */
export function validateMarketplaceConfig(): boolean {
  const config = marketplaceConfig;
  
  if (config.buyerRequestTTLHours < 1) {
    console.error('[Marketplace] Invalid buyerRequestTTLHours:', config.buyerRequestTTLHours);
    return false;
  }
  
  if (config.buyerRequestTTLHours > 720) { // 30 days max
    console.error('[Marketplace] buyerRequestTTLHours cannot exceed 720 (30 days)');
    return false;
  }
  
  if (config.offerTTLHours < 1) {
    console.error('[Marketplace] Invalid offerTTLHours:', config.offerTTLHours);
    return false;
  }
  
  if (config.offerTTLHours > 168) { // 7 days max
    console.error('[Marketplace] offerTTLHours cannot exceed 168 (7 days)');
    return false;
  }
  
  if (config.maxOffersPerRequest < 1) {
    console.error('[Marketplace] maxOffersPerRequest cannot be less than 1:', config.maxOffersPerRequest);
    return false;
  }
  
  if (config.maxActiveRequestsPerBuyer < 1) {
    console.error('[Marketplace] maxActiveRequestsPerBuyer cannot be less than 1:', config.maxActiveRequestsPerBuyer);
    return false;
  }
  
  if (config.maxActiveAvailabilitiesPerTraveler < 1) {
    console.error('[Marketplace] maxActiveAvailabilitiesPerTraveler cannot be less than 1:', config.maxActiveAvailabilitiesPerTraveler);
    return false;
  }
  
  if (config.minTrustScoreForMatching < 0 || config.minTrustScoreForMatching > 100) {
    console.error('[Marketplace] minTrustScoreForMatching must be between 0 and 100:', config.minTrustScoreForMatching);
    return false;
  }
  
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'SAR', 'AED'];
  if (!validCurrencies.includes(config.defaultCurrency)) {
    console.error('[Marketplace] Invalid defaultCurrency:', config.defaultCurrency);
    return false;
  }
  
  return true;
}

/**
 * Get buyer request TTL in milliseconds
 */
export function getBuyerRequestTTL(): number {
  return marketplaceConfig.buyerRequestTTLHours * 60 * 60 * 1000;
}

/**
 * Get offer TTL in milliseconds
 */
export function getOfferTTL(): number {
  return marketplaceConfig.offerTTLHours * 60 * 60 * 1000;
}

/**
 * Check if auto-matching is enabled
 */
export function isAutoMatchingEnabled(): boolean {
  return marketplaceConfig.allowAutoMatching;
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  return marketplaceConfig.enableNotifications;
}

/**
 * Get default currency
 */
export function getDefaultCurrency(): string {
  return marketplaceConfig.defaultCurrency;
}

/**
 * Check if buyer can create new request
 */
export function canBuyerCreateRequest(activeRequestCount: number): boolean {
  return activeRequestCount < marketplaceConfig.maxActiveRequestsPerBuyer;
}

/**
 * Check if traveler can create new availability
 */
export function canTravelerCreateAvailability(activeAvailabilityCount: number): boolean {
  return activeAvailabilityCount < marketplaceConfig.maxActiveAvailabilitiesPerTraveler;
}

/**
 * Check if request can receive more offers
 */
export function canRequestReceiveMoreOffers(offerCount: number): boolean {
  return offerCount < marketplaceConfig.maxOffersPerRequest;
}

/**
 * Check if traveler trust score is sufficient for matching
 */
export function isTrustScoreSufficient(trustScore: number): boolean {
  return trustScore >= marketplaceConfig.minTrustScoreForMatching;
}

/**
 * Validate buyer request data
 */
export function validateBuyerRequest(data: any): { valid: boolean; error?: string } {
  if (!data.productDescription || data.productDescription.trim().length === 0) {
    return { valid: false, error: 'Product description is required' };
  }
  
  if (!data.category || data.category.trim().length === 0) {
    return { valid: false, error: 'Category is required' };
  }
  
  if (!data.destinationCountry || data.destinationCountry.trim().length === 0) {
    return { valid: false, error: 'Destination country is required' };
  }
  
  if (!data.currency || data.currency.trim().length === 0) {
    return { valid: false, error: 'Currency is required' };
  }
  
  if (data.maxBudget && data.maxBudget <= 0) {
    return { valid: false, error: 'Maximum budget must be positive' };
  }
  
  if (data.preferredDeliveryDate && new Date(data.preferredDeliveryDate) <= new Date()) {
    return { valid: false, error: 'Preferred delivery date must be in the future' };
  }
  
  return { valid: true };
}

/**
 * Validate traveler availability data
 */
export function validateTravelerAvailability(data: any): { valid: boolean; error?: string } {
  if (!data.route?.from?.country || data.route.from.country.trim().length === 0) {
    return { valid: false, error: 'Route origin country is required' };
  }
  
  if (!data.route?.to?.country || data.route.to.country.trim().length === 0) {
    return { valid: false, error: 'Route destination country is required' };
  }
  
  if (!data.dates?.availableFrom || !data.dates?.availableTo) {
    return { valid: false, error: 'Available from and to dates are required' };
  }
  
  if (new Date(data.dates.availableFrom) >= new Date(data.dates.availableTo)) {
    return { valid: false, error: 'Available from date must be before available to date' };
  }
  
  if (new Date(data.dates.availableFrom) <= new Date()) {
    return { valid: false, error: 'Available from date must be in the future' };
  }
  
  if (!data.capacity?.maxWeight || data.capacity.maxWeight <= 0) {
    return { valid: false, error: 'Maximum weight must be positive' };
  }
  
  if (!data.pricing?.baseRate || data.pricing.baseRate <= 0) {
    return { valid: false, error: 'Base rate must be positive' };
  }
  
  if (!data.pricing?.currency || data.pricing.currency.trim().length === 0) {
    return { valid: false, error: 'Pricing currency is required' };
  }
  
  return { valid: true };
}

/**
 * Validate traveler offer data
 */
export function validateTravelerOffer(data: any): { valid: boolean; error?: string } {
  if (!data.requestId || data.requestId.trim().length === 0) {
    return { valid: false, error: 'Request ID is required' };
  }
  
  if (!data.proposedPrice || data.proposedPrice <= 0) {
    return { valid: false, error: 'Proposed price must be positive' };
  }
  
  if (!data.currency || data.currency.trim().length === 0) {
    return { valid: false, error: 'Currency is required' };
  }
  
  if (!data.deliveryDate || new Date(data.deliveryDate) <= new Date()) {
    return { valid: false, error: 'Delivery date must be in the future' };
  }
  
  if (!data.deliveryMethod || data.deliveryMethod.trim().length === 0) {
    return { valid: false, error: 'Delivery method is required' };
  }
  
  return { valid: true };
}

// Validate configuration on startup
if (!validateMarketplaceConfig()) {
  throw new Error('[Marketplace] Invalid configuration detected');
}
