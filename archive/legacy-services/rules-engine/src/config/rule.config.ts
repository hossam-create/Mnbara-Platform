/**
 * Rule Configuration
 * Centralized configuration for all rule thresholds and parameters
 * Supports environment variables and default values
 */

export interface RuleThresholds {
  // User bidding limits
  USER_MAX_ACTIVE_BIDS: {
    maxActiveBids: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  
  // Traveler request limits
  TRAVELER_MAX_PENDING_REQUESTS: {
    maxPendingRequests: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  
  // Seller listing rate limits
  SELLER_LISTING_RATE_LIMIT: {
    maxListingsPerHour: number;
    maxListingsPerDay: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
  
  // Payment retry limits
  PAYMENT_RETRY_LIMIT: {
    maxRetries: number;
    retryWindowMinutes: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };
}

/**
 * Default rule thresholds
 */
const DEFAULT_THRESHOLDS: RuleThresholds = {
  USER_MAX_ACTIVE_BIDS: {
    maxActiveBids: 10,
    severity: 'MEDIUM'
  },
  
  TRAVELER_MAX_PENDING_REQUESTS: {
    maxPendingRequests: 5,
    severity: 'HIGH'
  },
  
  SELLER_LISTING_RATE_LIMIT: {
    maxListingsPerHour: 5,
    maxListingsPerDay: 50,
    severity: 'MEDIUM'
  },
  
  PAYMENT_RETRY_LIMIT: {
    maxRetries: 3,
    retryWindowMinutes: 60,
    severity: 'HIGH'
  }
};

/**
 * Get configuration value from environment or default
 */
function getEnvValue<T>(key: string, defaultValue: T): T {
  const envValue = process.env[key];
  if (envValue === undefined) {
    return defaultValue;
  }
  
  // Type conversion based on default value type
  if (typeof defaultValue === 'number') {
    const parsed = parseInt(envValue, 10);
    return isNaN(parsed) ? defaultValue : (parsed as T);
  }
  
  if (typeof defaultValue === 'string') {
    return envValue as T;
  }
  
  return defaultValue;
}

/**
 * Load rule thresholds from environment variables or defaults
 */
export function loadRuleThresholds(): RuleThresholds {
  return {
    USER_MAX_ACTIVE_BIDS: {
      maxActiveBids: getEnvValue('RULE_USER_MAX_ACTIVE_BIDS', DEFAULT_THRESHOLDS.USER_MAX_ACTIVE_BIDS.maxActiveBids),
      severity: getEnvValue('RULE_USER_MAX_ACTIVE_BIDS_SEVERITY', DEFAULT_THRESHOLDS.USER_MAX_ACTIVE_BIDS.severity)
    },
    
    TRAVELER_MAX_PENDING_REQUESTS: {
      maxPendingRequests: getEnvValue('RULE_TRAVELER_MAX_PENDING_REQUESTS', DEFAULT_THRESHOLDS.TRAVELER_MAX_PENDING_REQUESTS.maxPendingRequests),
      severity: getEnvValue('RULE_TRAVELER_MAX_PENDING_REQUESTS_SEVERITY', DEFAULT_THRESHOLDS.TRAVELER_MAX_PENDING_REQUESTS.severity)
    },
    
    SELLER_LISTING_RATE_LIMIT: {
      maxListingsPerHour: getEnvValue('RULE_SELLER_MAX_LISTINGS_PER_HOUR', DEFAULT_THRESHOLDS.SELLER_LISTING_RATE_LIMIT.maxListingsPerHour),
      maxListingsPerDay: getEnvValue('RULE_SELLER_MAX_LISTINGS_PER_DAY', DEFAULT_THRESHOLDS.SELLER_LISTING_RATE_LIMIT.maxListingsPerDay),
      severity: getEnvValue('RULE_SELLER_LISTING_RATE_LIMIT_SEVERITY', DEFAULT_THRESHOLDS.SELLER_LISTING_RATE_LIMIT.severity)
    },
    
    PAYMENT_RETRY_LIMIT: {
      maxRetries: getEnvValue('RULE_PAYMENT_MAX_RETRIES', DEFAULT_THRESHOLDS.PAYMENT_RETRY_LIMIT.maxRetries),
      retryWindowMinutes: getEnvValue('RULE_PAYMENT_RETRY_WINDOW_MINUTES', DEFAULT_THRESHOLDS.PAYMENT_RETRY_LIMIT.retryWindowMinutes),
      severity: getEnvValue('RULE_PAYMENT_RETRY_LIMIT_SEVERITY', DEFAULT_THRESHOLDS.PAYMENT_RETRY_LIMIT.severity)
    }
  };
}

/**
 * Current rule thresholds (loaded at startup)
 */
export const ruleThresholds: RuleThresholds = loadRuleThresholds();

/**
 * Reload rule thresholds from environment
 * Useful for runtime configuration updates
 */
export function reloadRuleThresholds(): void {
  Object.assign(ruleThresholds, loadRuleThresholds());
}

/**
 * Get specific rule threshold
 */
export function getRuleThreshold<K extends keyof RuleThresholds>(ruleName: K): RuleThresholds[K] {
  return ruleThresholds[ruleName];
}
