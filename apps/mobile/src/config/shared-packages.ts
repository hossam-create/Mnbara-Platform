/**
 * Shared Packages Configuration
 * 
 * This file documents the integration of shared @mnbara/* packages
 * used by the mobile application.
 * 
 * Available Packages:
 * - @mnbara/types: Shared TypeScript type definitions
 * - @mnbara/utils: Shared utility functions (currency, date, validation, helpers)
 * - @mnbara/api-client: Shared API client with interceptors
 * - @mnbara/validation: Shared validation schemas (Zod)
 */

/**
 * @mnbara/types
 * 
 * Provides shared type definitions for:
 * - User types (UserRole, UserStatus, KYCStatus, AccountType, UserProfile)
 * - Order types (OrderStatus, OrderType, PaymentStatus, FulfillmentStatus, DeliveryMethod)
 * - Payment types (PaymentMethodType, PaymentStatus, PaymentProvider, CardType, Currency)
 * - Delivery types (DeliveryStatus, DeliveryType, DeliveryPriority, PackageSize, DeliveryMethod)
 * - Common types (BaseEntity, GeoLocation, Address, DeliveryAddress, PaginationParams)
 * 
 * Usage:
 * import { UserRole, DeliveryStatus, PaymentStatus } from '@mnbara/types';
 */
export const TYPES_PACKAGE = '@mnbara/types';

/**
 * @mnbara/utils
 * 
 * Provides utility functions for:
 * - Currency formatting (formatCurrency, formatCompactCurrency, formatPercentage, parseCurrency)
 * - Date formatting (formatDate, formatRelativeTime, formatCalendarDate, getStartOfDay, getEndOfDay)
 * - Validation helpers (isValidEmail, isValidPhone, isValidUrl, isValidCreditCard, validatePassword)
 * - Type helpers (isDefined, isString, isNumber, isInteger, isBoolean)
 * 
 * Usage:
 * import { formatCurrency, formatDate, isValidEmail } from '@mnbara/utils';
 */
export const UTILS_PACKAGE = '@mnbara/utils';

/**
 * @mnbara/api-client
 * 
 * Provides a shared API client with:
 * - Axios-based HTTP client
 * - Request/response interceptors
 * - Authentication interceptor
 * - Error handling
 * - Retry logic
 * 
 * Usage:
 * import { ApiClient } from '@mnbara/api-client';
 * const client = new ApiClient({ baseURL: 'https://api.example.com' });
 */
export const API_CLIENT_PACKAGE = '@mnbara/api-client';

/**
 * @mnbara/validation
 * 
 * Provides Zod validation schemas for:
 * - User data validation
 * - Order data validation
 * - Payment data validation
 * - Delivery data validation
 * 
 * Usage:
 * import { userSchema, orderSchema } from '@mnbara/validation';
 */
export const VALIDATION_PACKAGE = '@mnbara/validation';

/**
 * Integration Notes
 * 
 * 1. Type Definitions:
 *    - Use @mnbara/types for all shared domain types
 *    - Avoid duplicating type definitions in the mobile app
 *    - Import types from @mnbara/types instead of defining locally
 * 
 * 2. Utilities:
 *    - Use @mnbara/utils for common formatting and validation functions
 *    - Replace local utility implementations with shared ones
 *    - Maintain mobile-specific utilities in src/core/utils/
 * 
 * 3. API Client:
 *    - The mobile app can use @mnbara/api-client for base HTTP functionality
 *    - Mobile-specific API client (apps/mobile/src/services/api/client.ts) wraps
 *      the shared client with React Native-specific features (Redux integration, etc.)
 *    - Keep mobile-specific interceptors and error handling in the mobile app
 * 
 * 4. Validation:
 *    - Use @mnbara/validation schemas for data validation
 *    - Integrate with React Hook Form for form validation
 *    - Maintain mobile-specific validation rules locally
 * 
 * 5. Environment Variables:
 *    - Mobile app uses react-native-config for environment variables
 *    - Shared packages use standard Node.js process.env
 *    - Mobile app configuration is in apps/mobile/src/config/
 * 
 * 6. Navigation & State Management:
 *    - Navigation structure is preserved in apps/mobile/src/navigation/
 *    - Redux store is preserved in apps/mobile/src/store/
 *    - These are mobile-specific and not shared
 */

export default {
  TYPES_PACKAGE,
  UTILS_PACKAGE,
  API_CLIENT_PACKAGE,
  VALIDATION_PACKAGE,
};
