// Export all core rules
export { USER_MAX_ACTIVE_BIDS_Rule } from './USER_MAX_ACTIVE_BIDS.rule';
export { TRAVELER_MAX_PENDING_REQUESTS_Rule } from './TRAVELER_MAX_PENDING_REQUESTS.rule';
export { SELLER_LISTING_RATE_LIMIT_Rule } from './SELLER_LISTING_RATE_LIMIT.rule';
export { PAYMENT_RETRY_LIMIT_Rule } from './PAYMENT_RETRY_LIMIT.rule';

// Export array of all core rules for easy registration
import { USER_MAX_ACTIVE_BIDS_Rule } from './USER_MAX_ACTIVE_BIDS.rule';
import { TRAVELER_MAX_PENDING_REQUESTS_Rule } from './TRAVELER_MAX_PENDING_REQUESTS.rule';
import { SELLER_LISTING_RATE_LIMIT_Rule } from './SELLER_LISTING_RATE_LIMIT.rule';
import { PAYMENT_RETRY_LIMIT_Rule } from './PAYMENT_RETRY_LIMIT.rule';

export const coreRules = [
  USER_MAX_ACTIVE_BIDS_Rule,
  TRAVELER_MAX_PENDING_REQUESTS_Rule,
  SELLER_LISTING_RATE_LIMIT_Rule,
  PAYMENT_RETRY_LIMIT_Rule
];
