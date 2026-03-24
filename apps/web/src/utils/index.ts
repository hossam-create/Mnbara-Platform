/**
 * Web App Utils Index
 * Re-exports shared utilities from @mnbara/utils and local utilities
 */

// Re-export shared utilities from @mnbara/utils
export {
  formatCurrency,
  formatCompactCurrency,
  formatPercentage,
  formatNumber,
  parseCurrency,
} from '@mnbara/utils';

export {
  formatDate,
  formatRelativeTime,
  formatCalendarDate,
  getStartOfDay,
  getEndOfDay,
} from '@mnbara/utils';

export {
  isDefined,
  isString,
  isNumber,
  isInteger,
  isBoolean,
} from '@mnbara/utils';

export {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  isValidCreditCard,
  validatePassword,
} from '@mnbara/utils';

// Re-export local utilities
export * from './eventValidation.utils';
export * from './paymentVerification';
export * from './securityValidation';
