/**
 * API Configuration
 * Central configuration for all backend microservices
 */

export const API_CONFIG = {
  // Base URLs
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws',
  
  // Service endpoints
  SERVICES: {
    LISTING: '/listings',
    SEARCH: '/search',
    AI_CORE: '/ai-core',
    CROWDSHIP: '/crowdship',
    AUTH: '/auth',
    PAYMENT: '/payment',
    NOTIFICATION: '/notification',
  },
  
  // Request configuration
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  
  // Feature flags
  FEATURES: {
    AI_ADVISORY: import.meta.env.VITE_ENABLE_AI_ADVISORY !== 'false',
    CROWDSHIP: import.meta.env.VITE_ENABLE_CROWDSHIP !== 'false',
    SEARCH_FILTERS: import.meta.env.VITE_ENABLE_SEARCH_FILTERS !== 'false',
    TRUST_SCORING: import.meta.env.VITE_ENABLE_TRUST_SCORING !== 'false',
  },
};

export type FeatureFlag = keyof typeof API_CONFIG.FEATURES;

export const isFeatureEnabled = (feature: FeatureFlag): boolean => {
  return API_CONFIG.FEATURES[feature] === true;
};
